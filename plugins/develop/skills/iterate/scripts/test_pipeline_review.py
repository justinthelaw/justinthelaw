"""Exercise the production review adapter through the real watcher."""

import copy
import json
import sys
import unittest
from dataclasses import replace
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))

from pipeline_monitor import Watcher
from pipeline_support import WatchError, ensure_read_only
from pipeline_test_support import FakeClock, target
from test_pipeline_checks import CoverageRunner


BOT = {"login": "chatgpt-codex-connector[bot]", "type": "Bot", "__typename": "Bot"}


def connection(nodes=(), truncated=False):
    return {"nodes": list(nodes), "pageInfo": {"hasPreviousPage": truncated}}


def reaction(content, hour=2, identifier=1):
    return {"id": identifier, "content": content, "created_at": f"2026-01-01T0{hour}:00:00Z", "user": BOT}


def review(current, *, hour=3, state="APPROVED", body=""):
    return {"author": BOT, "state": state, "submittedAt": f"2026-01-01T0{hour}:00:00Z",
            "body": body, "url": "https://github.com/owner/project/pull/7#review", "commit": {"oid": current.head}}


def request(*, hour=2, association="OWNER", body="@codex review"):
    return {"author": {"login": "person", "__typename": "User"}, "authorAssociation": association,
            "createdAt": f"2026-01-01T0{hour}:00:00Z", "bodyText": body}


class ReviewRunner(CoverageRunner):
    def __init__(self, current=None, *, reactions=(), reviews=(), comments=(), threads=()):
        super().__init__(current or target())
        self.pr = {"number": 7, "url": "https://github.com/owner/project/pull/7", "headRefOid": self.current.head,
                   "headRefName": self.current.branch, "headRepositoryOwner": {"login": "owner"},
                   "isCrossRepository": False, "baseRefName": "main"}
        self.reactions = list(reactions)
        self.selected = {
            "number": 7, "state": "OPEN", "url": self.pr["url"], "headRefName": self.current.branch,
            "headRefOid": self.current.head, "baseRefName": "main", "isCrossRepository": False,
            "headRepository": {"nameWithOwner": "owner/project"},
            "commits": {"nodes": [{"commit": {"oid": self.current.head, "committedDate": "2026-01-01T01:00:00Z"}}]},
            "comments": connection(comments), "reviews": connection(reviews), "reviewThreads": connection(threads),
        }
        self.graph_errors = None

    def __call__(self, argv, cwd=None, optional=False):
        ensure_read_only(argv)
        if argv[:3] == ["gh", "api", "graphql"]:
            self.calls.append(argv)
            return json.dumps({"data": {"repository": {"pullRequest": self.selected}}, "errors": self.graph_errors})
        if argv[:2] == ["gh", "api"] and "/reactions?" in argv[2]:
            self.calls.append(argv)
            return json.dumps(self.reactions)
        return super().__call__(argv, cwd, optional)


class ProductionReviewTests(unittest.TestCase):
    def snapshot(self, runner):
        events = []
        monitor = Watcher([runner.current], runner=runner, emit=events.append, monitor_reviews=True)
        status = monitor.watch(once=True)
        return status, monitor, events

    def test_timestamp_correlated_thumb_does_not_pass(self):
        runner = ReviewRunner(reactions=[reaction("eyes"), reaction("+1", hour=3, identifier=2)])
        result, monitor, _ = self.snapshot(runner)
        self.assertEqual(result, 3)
        self.assertEqual(monitor.review_states[runner.current.key].status, "active")

    def test_review_discovery_needs_no_local_epoch_conversion(self):
        class WindowsEpochDateTime(datetime):
            @classmethod
            def fromtimestamp(cls, *args, **kwargs):
                raise OSError(22, "Invalid argument")

        runner = ReviewRunner()
        runner.runs = []
        monitor = Watcher([runner.current], runner=runner, emit=lambda event: None, monitor_reviews=True)
        with patch("pipeline_monitor.datetime", WindowsEpochDateTime):
            monitor.discover_runs(initial=True)
        self.assertEqual(monitor.review_activation[runner.current.key], datetime(1970, 1, 1, tzinfo=timezone.utc))

    def test_thumb_without_eye_is_still_not_approval(self):
        runner = ReviewRunner(reactions=[reaction("+1", hour=3)])
        result, monitor, _ = self.snapshot(runner)
        self.assertEqual(result, 3)
        self.assertEqual(monitor.review_states[runner.current.key].source, "unverified-reaction")

    def test_exact_head_submitted_review_passes(self):
        current = target()
        runner = ReviewRunner(current, reactions=[reaction("eyes")], reviews=[review(current)])
        self.assertEqual(self.snapshot(runner)[0], 0)

    def test_review_on_old_sha_never_approves_new_sha(self):
        old, new = target(), target(head="b" * 40)
        runner = ReviewRunner(new, reactions=[reaction("eyes"), reaction("+1", hour=4, identifier=2)], reviews=[review(old)])
        self.assertEqual(self.snapshot(runner)[0], 3)

    def test_previous_request_remains_required_after_new_commit(self):
        runner = ReviewRunner(target(head="b" * 40), comments=[request(hour=0)], reviews=[review(target())])
        self.assertEqual(self.snapshot(runner)[0], 3)

    def test_new_request_invalidates_an_earlier_exact_head_review(self):
        current = target()
        runner = ReviewRunner(current, comments=[request(hour=4)], reviews=[review(current, hour=3)])
        self.assertEqual(self.snapshot(runner)[0], 3)

    def test_unrequested_review_is_optional_and_untrusted_requests_are_ignored(self):
        for comments in ([], [request(association="CONTRIBUTOR")], [request(body="Quoted example:\n@codex review")]):
            with self.subTest(comments=comments):
                self.assertEqual(self.snapshot(ReviewRunner(comments=comments))[0], 0)

    def test_outdated_unresolved_codex_thread_remains_a_finding(self):
        current = target()
        thread = {"id": "thread7", "isResolved": False, "isOutdated": True, "path": "module.py", "line": 4,
                  "comments": connection([{"author": BOT, "bodyText": "Fix this ghp_abcdefghijklmnopqrstuvwx", "url": "https://github.com/comment"}])}
        runner = ReviewRunner(current, reviews=[review(current)], threads=[thread])
        status, monitor, events = self.snapshot(runner)
        self.assertEqual(status, 1)
        finding = monitor.review_states[current.key].findings[0]
        self.assertTrue(finding["outdated"])
        self.assertIn("[REDACTED]", finding["excerpt"])
        self.assertTrue(any(event["event"] == "review-finding" for event in events))

    def test_resolved_thread_does_not_block_exact_review(self):
        current = target()
        runner = ReviewRunner(current, reviews=[review(current)], threads=[{"isResolved": True}])
        self.assertEqual(self.snapshot(runner)[0], 0)

    def test_changes_requested_and_actionable_review_body_fail(self):
        current = target()
        for state in ("CHANGES_REQUESTED", "COMMENTED"):
            with self.subTest(state=state):
                runner = ReviewRunner(current, reviews=[review(current, state=state, body="The handler loses events.")])
                self.assertEqual(self.snapshot(runner)[0], 1)

    def test_graphql_errors_and_truncated_connections_never_pass(self):
        for surface in ("errors", "comments", "reviews", "reviewThreads", "reactions"):
            with self.subTest(surface=surface):
                runner = ReviewRunner()
                if surface == "errors":
                    runner.graph_errors = [{"message": "permission denied"}]
                elif surface == "reactions":
                    runner.reactions = [reaction("eyes", identifier=i) for i in range(100)]
                else:
                    runner.selected[surface]["pageInfo"]["hasPreviousPage"] = True
                with self.assertRaisesRegex(WatchError, "coverage|access"):
                    self.snapshot(runner)

    def test_changed_head_or_base_between_discovery_and_review_blocks(self):
        for field, value in (("headRefOid", "c" * 40), ("baseRefName", "release")):
            with self.subTest(field=field):
                runner = ReviewRunner()
                runner.selected[field] = value
                with self.assertRaisesRegex(WatchError, "changed"):
                    self.snapshot(runner)

    def test_head_changed_before_discovery_blocks(self):
        runner = ReviewRunner()
        runner.pr["headRefOid"] = "c" * 40
        with self.assertRaisesRegex(WatchError, "differs"):
            self.snapshot(runner)

    def test_saturated_pr_discovery_blocks(self):
        runner = ReviewRunner()
        def run(argv, cwd=None, optional=False):
            if argv[:3] == ["gh", "pr", "list"]:
                return json.dumps([runner.pr] * 100)
            return runner(argv, cwd, optional)
        with self.assertRaisesRegex(WatchError, "100-item limit"):
            Watcher([runner.current], runner=run, emit=lambda event: None, monitor_reviews=True).watch(once=True)

    def test_same_labels_keep_review_state_independent(self):
        first = ReviewRunner(reviews=[review(target())])
        second_target = replace(target(), path=Path("/elsewhere/project"), root=Path("/elsewhere/project"), repository="other/project")
        second = ReviewRunner(second_target, reactions=[reaction("eyes")])
        second.pr["headRepositoryOwner"] = {"login": "other"}
        second.selected["headRepository"] = {"nameWithOwner": "other/project"}
        def run(argv, cwd=None, optional=False):
            return (second if cwd == second_target.path else first)(argv, cwd, optional)
        monitor = Watcher([first.current, second.current], runner=run, emit=lambda event: None, monitor_reviews=True)
        self.assertEqual(monitor.watch(once=True), 3)
        self.assertEqual(monitor.review_states[first.current.key].status, "passed")
        self.assertEqual(monitor.review_states[second.current.key].status, "active")

    def test_waits_for_exact_head_review_then_completes(self):
        runner = ReviewRunner(reactions=[reaction("eyes"), reaction("+1", hour=3, identifier=2)])
        clock = FakeClock()
        def sleep(seconds):
            clock.sleep(seconds)
            runner.selected["reviews"] = connection([review(runner.current, hour=4)])
        monitor = Watcher([runner.current], runner=runner, emit=lambda event: None, monitor_reviews=True,
                          clock=clock.now, sleep=sleep, settle=0)
        self.assertEqual(monitor.watch(), 0)
        self.assertGreater(clock.current, 0)

    def test_unacknowledged_request_blocks_after_grace(self):
        runner = ReviewRunner(comments=[request()])
        clock = FakeClock()
        events = []
        monitor = Watcher([runner.current], runner=runner, emit=events.append, monitor_reviews=True,
                          clock=clock.now, sleep=clock.sleep, discovery_grace=10, interval=5)
        self.assertEqual(monitor.watch(), 2)
        self.assertEqual(events[-1]["reason"], "Codex review request was not acknowledged")

    def test_passed_review_disappearing_during_settlement_cannot_complete(self):
        for disappear in ("deleted", "dismissed"):
            with self.subTest(disappear=disappear):
                current = target()
                runner = ReviewRunner(current, reviews=[review(current)])
                clock = FakeClock()
                events = []
                def sleep(seconds):
                    clock.sleep(seconds)
                    runner.selected["reviews"] = connection(
                        [] if disappear == "deleted" else [review(current, state="DISMISSED")]
                    )
                monitor = Watcher([current], runner=runner, emit=events.append, monitor_reviews=True,
                                  clock=clock.now, sleep=sleep, interval=5, settle=10, timeout=20)
                with self.assertRaisesRegex(WatchError, "review evidence disappeared"):
                    monitor.watch()
                self.assertNotIn(current.key, monitor.review_states)
                self.assertNotIn(current.key, monitor.review_fingerprints)
                self.assertFalse(any(event.get("result") == "passed" for event in events))

    def test_review_disappearing_on_final_poll_invalidates_prior_pass(self):
        for disappear in ("deleted", "dismissed"):
            with self.subTest(disappear=disappear):
                current = target()
                runner = ReviewRunner(current, reviews=[review(current)])
                clock = FakeClock()
                graph_reads = 0
                def run(argv, cwd=None, optional=False):
                    nonlocal graph_reads
                    if argv[:3] == ["gh", "api", "graphql"]:
                        graph_reads += 1
                        if graph_reads > 1:
                            runner.selected["reviews"] = connection(
                                [] if disappear == "deleted" else [review(current, state="DISMISSED")]
                            )
                    return runner(argv, cwd, optional)
                monitor = Watcher([current], runner=run, emit=lambda event: None, monitor_reviews=True,
                                  clock=clock.now, sleep=clock.sleep, interval=5, settle=0, timeout=10)
                with self.assertRaisesRegex(WatchError, "review evidence disappeared"):
                    monitor.watch()
                self.assertGreaterEqual(graph_reads, 2)
                self.assertNotIn(current.key, monitor.review_states)

    def test_missing_negative_review_clears_old_findings_and_blocks(self):
        current = target()
        runner = ReviewRunner(current, reviews=[review(current, state="CHANGES_REQUESTED", body="Fix the handler.")])
        monitor = Watcher([current], runner=runner, emit=lambda event: None, monitor_reviews=True)
        self.assertEqual(monitor.watch(once=True), 1)
        self.assertTrue(monitor.review_states[current.key].findings)
        runner.selected["reviews"] = connection()
        with self.assertRaisesRegex(WatchError, "review evidence disappeared"):
            monitor.watch(once=True)
        self.assertNotIn(current.key, monitor.review_states)
        self.assertNotIn(current.key, monitor.review_fingerprints)
        self.assertEqual(monitor.counts()["reviews_failed"], 0)

    def test_disappearing_request_does_not_make_active_review_optional(self):
        runner = ReviewRunner(comments=[request()])
        monitor = Watcher([runner.current], runner=runner, emit=lambda event: None, monitor_reviews=True)
        self.assertEqual(monitor.watch(once=True), 3)
        since = monitor.review_states[runner.current.key].required_since
        runner.selected["comments"] = connection()
        self.assertEqual(monitor.watch(once=True), 3)
        self.assertEqual(monitor.review_states[runner.current.key].required_since, since)


if __name__ == "__main__":
    unittest.main()
