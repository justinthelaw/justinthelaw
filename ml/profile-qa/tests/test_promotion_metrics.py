from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from profile_qa.prepare_hf_artifacts import (
    _copy_tree_contents,
    validate_promotion_metrics,
)


def _report(
    *,
    macro: float,
    refusal_accuracy: float,
    multi_turn_accuracy: float,
) -> dict[str, object]:
    return {
        "macro": macro,
        "refusal_accuracy": refusal_accuracy,
        "multi_turn_accuracy": multi_turn_accuracy,
        "by_task": {
            "refusal": refusal_accuracy,
            "multi_turn": multi_turn_accuracy,
            "single_turn": macro,
        },
    }


class PromotionMetricTests(unittest.TestCase):
    def _passing_reports(self) -> dict[str, dict[str, object]]:
        return {
            "baseline_test": _report(
                macro=0.80,
                refusal_accuracy=0.50,
                multi_turn_accuracy=0.50,
            ),
            "promoted_validation": _report(
                macro=0.90,
                refusal_accuracy=0.95,
                multi_turn_accuracy=0.80,
            ),
            "promoted_test": _report(
                macro=0.92,
                refusal_accuracy=0.95,
                multi_turn_accuracy=0.80,
            ),
        }

    def test_promotion_metrics_accept_exact_thresholds(self) -> None:
        validate_promotion_metrics(**self._passing_reports())

    def test_promotion_metrics_rejects_below_baseline_improvement(self) -> None:
        reports = self._passing_reports()
        reports["promoted_test"]["macro"] = 0.919

        with self.assertRaisesRegex(ValueError, "improve on baseline test"):
            validate_promotion_metrics(**reports)

    def test_promotion_metrics_rejects_inconsistent_task_score(self) -> None:
        reports = self._passing_reports()
        reports["promoted_validation"]["by_task"] = {
            "refusal": 0.94,
            "multi_turn": 0.80,
            "single_turn": 0.90,
        }

        with self.assertRaisesRegex(ValueError, "must agree with"):
            validate_promotion_metrics(**reports)

    def test_promotion_metrics_rejects_missing_required_task(self) -> None:
        reports = self._passing_reports()
        reports["promoted_test"]["by_task"] = {
            "refusal": 0.95,
            "single_turn": 0.92,
        }

        with self.assertRaisesRegex(ValueError, "multi_turn"):
            validate_promotion_metrics(**reports)

    def test_copy_rejects_an_output_nested_inside_its_source(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "browser"
            source.mkdir()
            sentinel = source / "keep.txt"
            sentinel.write_text("unchanged", encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "must not overlap release input"):
                _copy_tree_contents(source, source / "model")

            self.assertEqual(sentinel.read_text(encoding="utf-8"), "unchanged")


if __name__ == "__main__":
    unittest.main()
