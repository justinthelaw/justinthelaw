from __future__ import annotations

import argparse
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from profile_qa.config import PRIMARY_BASE_MODEL_ID, PRIMARY_BASE_MODEL_REVISION
from profile_qa.prepare_hf_artifacts import (
    load_model_provenance,
    prepare_dataset_payload,
    prepare_model_payload,
)
from profile_qa.provenance import (
    ADAPTER_CHECKPOINT_FIELD,
    ADAPTER_DIGEST_FIELD,
    BASE_MODEL_REVISION_FIELD,
    DATASET_DIGEST_FIELD,
    EXPECTED_LINEAGE_PIPELINE,
    LINEAGE_SCHEMA_VERSION,
    MERGED_DIGEST_FIELD,
    PROMPT_DIGEST_FIELD,
    directory_sha256,
    file_sha256,
    validate_artifact_lineage,
    write_artifact_lineage,
)
from profile_qa.train_lora import evaluation_prompt_sha256
from profile_qa.validation import canonical_jsonl_sha256, read_jsonl


class ModelCardProvenanceTests(unittest.TestCase):
    def _write_lineage(
        self,
        directory: Path,
        *,
        log_history: list[dict[str, object]] | None = None,
    ) -> tuple[Path, Path]:
        checkpoint_dir = directory / "teapot-profile-qa-lora-v6" / "checkpoint-80"
        checkpoint_dir.mkdir(parents=True)
        trainer_state = {
            "log_history": log_history
            if log_history is not None
            else [
                {"loss": 0.12, "step": 40},
                {"eval_loss": 0.08, "step": 40},
                {"loss": 0.03125, "step": 80},
                {"eval_loss": 0.04, "step": 80},
            ]
        }
        (checkpoint_dir / "trainer_state.json").write_text(
            json.dumps(trainer_state),
            encoding="utf-8",
        )
        (checkpoint_dir / "adapter_model.safetensors").write_bytes(b"adapter")
        lineage_path = directory / "teapot_profile_qa_lineage.json"
        lineage_path.write_text(
            json.dumps(
                {
                    "schema_version": LINEAGE_SCHEMA_VERSION,
                    "adapter_model_id": str(checkpoint_dir.resolve()),
                    ADAPTER_CHECKPOINT_FIELD: checkpoint_dir.name,
                    ADAPTER_DIGEST_FIELD: directory_sha256(checkpoint_dir),
                    "base_model": PRIMARY_BASE_MODEL_ID,
                    BASE_MODEL_REVISION_FIELD: PRIMARY_BASE_MODEL_REVISION,
                    "pipeline": EXPECTED_LINEAGE_PIPELINE,
                    MERGED_DIGEST_FIELD: "1" * 64,
                },
                indent=2,
                sort_keys=True,
            ),
            encoding="utf-8",
        )
        return lineage_path, checkpoint_dir

    def _write_browser_artifact(self, root: Path, lineage_path: Path) -> Path:
        browser_dir = root / "browser"
        browser_dir.mkdir()
        (browser_dir / "config.json").write_text("{}", encoding="utf-8")
        (browser_dir / "onnx").mkdir()
        (browser_dir / "onnx" / "encoder_model_int8.onnx").write_bytes(b"onnx")
        write_artifact_lineage(
            browser_dir,
            source_lineage=json.loads(lineage_path.read_text(encoding="utf-8")),
            source_lineage_sha256=file_sha256(lineage_path),
            stage="browser",
        )
        return browser_dir

    def _write_report(
        self,
        path: Path,
        *,
        split: str,
        checkpoint_dir: Path | None,
        dataset_path: Path,
        adapter_digest: str | None = None,
    ) -> Path:
        dataset_records = read_jsonl(dataset_path)
        dataset_sha256 = canonical_jsonl_sha256(dataset_records)
        prompt_sha256 = evaluation_prompt_sha256(
            [record for record in dataset_records if record.get("split") == split]
        )
        report: dict[str, object] = {
            "macro": 1.0,
            "refusal_accuracy": 1.0,
            "multi_turn_accuracy": 1.0,
            "by_task": {"single_turn": 1.0},
        }
        if checkpoint_dir is None:
            report["provenance"] = {
                "model_kind": "baseline",
                "model_id": PRIMARY_BASE_MODEL_ID,
                BASE_MODEL_REVISION_FIELD: PRIMARY_BASE_MODEL_REVISION,
                "base_model": PRIMARY_BASE_MODEL_ID,
                DATASET_DIGEST_FIELD: dataset_sha256,
                PROMPT_DIGEST_FIELD: prompt_sha256,
                "split": split,
            }
        else:
            digest = adapter_digest or directory_sha256(checkpoint_dir)
            report["provenance"] = {
                "model_kind": "adapter",
                "model_id": checkpoint_dir.name,
                "model_sha256": digest,
                ADAPTER_CHECKPOINT_FIELD: checkpoint_dir.name,
                ADAPTER_DIGEST_FIELD: digest,
                "base_model": PRIMARY_BASE_MODEL_ID,
                BASE_MODEL_REVISION_FIELD: PRIMARY_BASE_MODEL_REVISION,
                DATASET_DIGEST_FIELD: dataset_sha256,
                PROMPT_DIGEST_FIELD: prompt_sha256,
                "split": split,
            }
        path.write_text(json.dumps(report), encoding="utf-8")
        return path

    def _release_args(
        self,
        root: Path,
        lineage_path: Path,
        checkpoint_dir: Path,
        browser_dir: Path,
    ) -> argparse.Namespace:
        dataset_path = root / "profile_qa.jsonl"
        dataset_path.write_text(
            '{ "question": "Validation question?", "task": "single_turn", '
            '"split": "validation", "id": "validation-example" }\n'
            '{"task":"single_turn", "question":"Test question?", '
            '"id":"test-example", "split":"test"}\n',
            encoding="utf-8",
        )
        return argparse.Namespace(
            model_browser_dir=str(browser_dir),
            output_dir=str(root / "hf"),
            model_repo_id="owner/model",
            dataset_repo_id="owner/dataset",
            baseline_report=str(
                self._write_report(
                    root / "baseline.json",
                    split="test",
                    checkpoint_dir=None,
                    dataset_path=dataset_path,
                )
            ),
            validation_report=str(
                self._write_report(
                    root / "validation.json",
                    split="validation",
                    checkpoint_dir=checkpoint_dir,
                    dataset_path=dataset_path,
                )
            ),
            test_report=str(
                self._write_report(
                    root / "test.json",
                    split="test",
                    checkpoint_dir=checkpoint_dir,
                    dataset_path=dataset_path,
                )
            ),
            lineage_file=str(lineage_path),
            dataset=str(dataset_path),
            release_date="2026-08-07",
        )

    def test_model_card_uses_validated_release_provenance(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            lineage_path, checkpoint_dir = self._write_lineage(root)
            browser_dir = self._write_browser_artifact(root, lineage_path)
            args = self._release_args(
                root,
                lineage_path,
                checkpoint_dir,
                browser_dir,
            )
            expected_browser_digest = json.loads(
                (browser_dir / "teapot_profile_qa_lineage.json").read_text(
                    encoding="utf-8"
                )
            )["artifact_sha256"]
            model_dir = prepare_model_payload(args)
            model_card = (model_dir / "README.md").read_text(encoding="utf-8")
            published_lineage = validate_artifact_lineage(
                model_dir,
                source_lineage_sha256=file_sha256(lineage_path),
                stage="browser",
            )

        self.assertIn("Promoted checkpoint: `checkpoint-80`", model_card)
        self.assertIn("Latest recorded train loss: 0.0312 at step 80", model_card)
        self.assertIn("Best recorded validation eval loss: 0.0400", model_card)
        self.assertIn("2026-08-07: Browser profile-QA export", model_card)
        self.assertIn(PRIMARY_BASE_MODEL_REVISION, model_card)
        self.assertIn(expected_browser_digest, model_card)
        self.assertEqual(published_lineage["artifact_sha256"], expected_browser_digest)
        self.assertNotIn("adapter_model_id", published_lineage)
        self.assertEqual(
            published_lineage[ADAPTER_CHECKPOINT_FIELD],
            "checkpoint-80",
        )
        self.assertNotIn("teapot-profile-qa-lora-v5/checkpoint-40", model_card)
        self.assertNotIn("0.0330", model_card)
        self.assertNotIn("0.0287", model_card)
        self.assertNotIn("2026-06-19", model_card)

    def test_missing_release_date_fails_clearly(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            lineage_path, _ = self._write_lineage(root)
            browser_dir = self._write_browser_artifact(root, lineage_path)

            with self.assertRaisesRegex(ValueError, "release date is required"):
                load_model_provenance(lineage_path, browser_dir, None)

    def test_invalid_release_date_fails_clearly(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            lineage_path, _ = self._write_lineage(root)
            browser_dir = self._write_browser_artifact(root, lineage_path)

            with self.assertRaisesRegex(ValueError, "must use YYYY-MM-DD"):
                load_model_provenance(
                    lineage_path,
                    browser_dir,
                    "August 7, 2026",
                )

    def test_missing_training_metrics_fail_clearly(self) -> None:
        cases = [
            ([{"eval_loss": 0.04, "step": 80}], "recorded training loss"),
            ([{"loss": 0.03, "step": 80}], "recorded validation eval loss"),
        ]
        for log_history, expected_message in cases:
            with self.subTest(expected_message=expected_message):
                with tempfile.TemporaryDirectory() as directory:
                    root = Path(directory)
                    lineage_path, _ = self._write_lineage(
                        root,
                        log_history=log_history,
                    )
                    browser_dir = self._write_browser_artifact(root, lineage_path)

                    with self.assertRaisesRegex(ValueError, expected_message):
                        load_model_provenance(
                            lineage_path,
                            browser_dir,
                            "2026-08-07",
                        )

    def test_tampered_browser_artifact_preserves_existing_model_payload(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            lineage_path, checkpoint_dir = self._write_lineage(root)
            browser_dir = self._write_browser_artifact(root, lineage_path)
            args = self._release_args(
                root,
                lineage_path,
                checkpoint_dir,
                browser_dir,
            )
            model_output_dir = root / "hf" / "model"
            model_output_dir.mkdir(parents=True)
            sentinel = model_output_dir / "keep.txt"
            sentinel.write_text("unchanged", encoding="utf-8")
            (browser_dir / "config.json").write_text('{"tampered": true}', encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "artifact digest"):
                prepare_model_payload(args)

            self.assertEqual(sentinel.read_text(encoding="utf-8"), "unchanged")

    def test_browser_artifact_from_another_lineage_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            first_lineage, _ = self._write_lineage(root / "first")
            browser_dir = self._write_browser_artifact(root, first_lineage)
            selected_lineage, selected_checkpoint = self._write_lineage(
                root / "selected"
            )
            args = self._release_args(
                root,
                selected_lineage,
                selected_checkpoint,
                browser_dir,
            )

            with self.assertRaisesRegex(ValueError, "selected merge lineage"):
                prepare_model_payload(args)

    def test_mismatched_evaluation_lineage_preserves_existing_payload(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            lineage_path, checkpoint_dir = self._write_lineage(root)
            browser_dir = self._write_browser_artifact(root, lineage_path)
            args = self._release_args(
                root,
                lineage_path,
                checkpoint_dir,
                browser_dir,
            )
            self._write_report(
                Path(args.test_report),
                split="test",
                checkpoint_dir=checkpoint_dir,
                dataset_path=Path(args.dataset),
                adapter_digest="f" * 64,
            )
            model_output_dir = root / "hf" / "model"
            model_output_dir.mkdir(parents=True)
            sentinel = model_output_dir / "keep.txt"
            sentinel.write_text("unchanged", encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "adapter digest"):
                prepare_model_payload(args)

            self.assertEqual(sentinel.read_text(encoding="utf-8"), "unchanged")

    def test_stale_report_for_another_dataset_preserves_existing_payload(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            lineage_path, checkpoint_dir = self._write_lineage(root)
            browser_dir = self._write_browser_artifact(root, lineage_path)
            args = self._release_args(
                root,
                lineage_path,
                checkpoint_dir,
                browser_dir,
            )
            Path(args.dataset).write_text(
                '{"id":"regenerated-example"}\n',
                encoding="utf-8",
            )
            model_output_dir = root / "hf" / "model"
            model_output_dir.mkdir(parents=True)
            sentinel = model_output_dir / "keep.txt"
            sentinel.write_text("unchanged", encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "dataset digest"):
                prepare_model_payload(args)

            self.assertEqual(sentinel.read_text(encoding="utf-8"), "unchanged")

            dataset_output_dir = root / "hf" / "dataset"
            dataset_output_dir.mkdir(parents=True)
            dataset_sentinel = dataset_output_dir / "keep.txt"
            dataset_sentinel.write_text("unchanged", encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "dataset digest"):
                prepare_dataset_payload(args)

            self.assertEqual(
                dataset_sentinel.read_text(encoding="utf-8"),
                "unchanged",
            )

    def test_report_for_another_base_revision_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            lineage_path, checkpoint_dir = self._write_lineage(root)
            browser_dir = self._write_browser_artifact(root, lineage_path)
            args = self._release_args(
                root,
                lineage_path,
                checkpoint_dir,
                browser_dir,
            )
            report_path = Path(args.validation_report)
            report = json.loads(report_path.read_text(encoding="utf-8"))
            report["provenance"][BASE_MODEL_REVISION_FIELD] = "0" * 40
            report_path.write_text(json.dumps(report), encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "base revision"):
                prepare_model_payload(args)

    def test_report_for_another_prompt_context_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            lineage_path, checkpoint_dir = self._write_lineage(root)
            browser_dir = self._write_browser_artifact(root, lineage_path)
            args = self._release_args(
                root,
                lineage_path,
                checkpoint_dir,
                browser_dir,
            )

            with (
                patch(
                    "profile_qa.train_lora.profile_context_text",
                    return_value="changed public profile context",
                ),
                self.assertRaisesRegex(ValueError, "prompt digest"),
            ):
                prepare_model_payload(args)

    def test_report_digest_matches_canonical_published_dataset(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            lineage_path, checkpoint_dir = self._write_lineage(root)
            browser_dir = self._write_browser_artifact(root, lineage_path)
            args = self._release_args(
                root,
                lineage_path,
                checkpoint_dir,
                browser_dir,
            )
            source_bytes = Path(args.dataset).read_bytes()

            prepare_model_payload(args)
            dataset_dir = prepare_dataset_payload(args)
            published_dataset = dataset_dir / "profile_qa.jsonl"
            report = json.loads(Path(args.test_report).read_text(encoding="utf-8"))

            self.assertNotEqual(source_bytes, published_dataset.read_bytes())
            self.assertEqual(
                report["provenance"][DATASET_DIGEST_FIELD],
                file_sha256(published_dataset),
            )

    def test_invalid_lineage_preserves_existing_model_payload(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            browser_dir = root / "browser"
            browser_dir.mkdir()
            lineage_path = root / "missing-lineage.json"
            model_output_dir = root / "hf" / "model"
            model_output_dir.mkdir(parents=True)
            sentinel = model_output_dir / "keep.txt"
            sentinel.write_text("unchanged", encoding="utf-8")
            args = argparse.Namespace(
                model_browser_dir=str(browser_dir),
                output_dir=str(root / "hf"),
                model_repo_id="owner/model",
                dataset_repo_id="owner/dataset",
                baseline_report=str(root / "unused-baseline.json"),
                validation_report=str(root / "unused-validation.json"),
                test_report=str(root / "unused-test.json"),
                lineage_file=str(lineage_path),
                release_date="2026-08-07",
            )

            with self.assertRaisesRegex(ValueError, "required model lineage"):
                prepare_model_payload(args)

            self.assertEqual(sentinel.read_text(encoding="utf-8"), "unchanged")


if __name__ == "__main__":
    unittest.main()
