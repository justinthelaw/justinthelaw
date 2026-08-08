from __future__ import annotations

import argparse
import json
import tempfile
import unittest
from pathlib import Path

from profile_qa.prepare_hf_artifacts import (
    load_model_provenance,
    prepare_model_payload,
)


class ModelCardProvenanceTests(unittest.TestCase):
    def _write_lineage(
        self,
        directory: Path,
        *,
        log_history: list[dict[str, object]] | None = None,
    ) -> Path:
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
        lineage_path = directory / "teapot_profile_qa_lineage.json"
        lineage_path.write_text(
            json.dumps(
                {
                    "adapter_model_id": str(checkpoint_dir),
                    "base_model": "teapotai/teapotllm",
                    "pipeline": "profile-qa-teapot-lora",
                }
            ),
            encoding="utf-8",
        )
        return lineage_path

    def test_model_card_uses_validated_release_provenance(self) -> None:
        report = {
            "macro": 1.0,
            "refusal_accuracy": 1.0,
            "multi_turn_accuracy": 1.0,
            "by_task": {"single_turn": 1.0},
        }

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            lineage_path = self._write_lineage(root)
            browser_dir = root / "browser"
            browser_dir.mkdir()
            (browser_dir / "config.json").write_text("{}", encoding="utf-8")
            report_path = root / "report.json"
            report_path.write_text(json.dumps(report), encoding="utf-8")
            args = argparse.Namespace(
                model_browser_dir=str(browser_dir),
                output_dir=str(root / "hf"),
                model_repo_id="owner/model",
                dataset_repo_id="owner/dataset",
                baseline_report=str(report_path),
                validation_report=str(report_path),
                test_report=str(report_path),
                lineage_file=str(lineage_path),
                release_date="2026-08-07",
            )
            model_dir = prepare_model_payload(args)
            model_card = (model_dir / "README.md").read_text(encoding="utf-8")

        self.assertIn("Promoted checkpoint: `checkpoint-80`", model_card)
        self.assertIn("Latest recorded train loss: 0.0312 at step 80", model_card)
        self.assertIn("Best recorded validation eval loss: 0.0400", model_card)
        self.assertIn("2026-08-07: Browser profile-QA export", model_card)
        self.assertNotIn("teapot-profile-qa-lora-v5/checkpoint-40", model_card)
        self.assertNotIn("0.0330", model_card)
        self.assertNotIn("0.0287", model_card)
        self.assertNotIn("2026-06-19", model_card)

    def test_missing_release_date_fails_clearly(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            lineage_path = self._write_lineage(Path(directory))

            with self.assertRaisesRegex(ValueError, "release date is required"):
                load_model_provenance(lineage_path, None)

    def test_invalid_release_date_fails_clearly(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            lineage_path = self._write_lineage(Path(directory))

            with self.assertRaisesRegex(ValueError, "must use YYYY-MM-DD"):
                load_model_provenance(lineage_path, "August 7, 2026")

    def test_missing_training_metrics_fail_clearly(self) -> None:
        cases = [
            ([{"eval_loss": 0.04, "step": 80}], "recorded training loss"),
            ([{"loss": 0.03, "step": 80}], "recorded validation eval loss"),
        ]
        for log_history, expected_message in cases:
            with self.subTest(expected_message=expected_message):
                with tempfile.TemporaryDirectory() as directory:
                    lineage_path = self._write_lineage(
                        Path(directory),
                        log_history=log_history,
                    )

                    with self.assertRaisesRegex(ValueError, expected_message):
                        load_model_provenance(lineage_path, "2026-08-07")

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
