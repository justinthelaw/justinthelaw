from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from profile_qa.prepare_hf_artifacts import (
    BROWSER_PIPELINE_TASK,
    ModelProvenance,
    _write_model_card,
)


class ModelCardMetadataTests(unittest.TestCase):
    def test_model_card_task_matches_browser_deployment(self) -> None:
        report = {
            "macro": 1.0,
            "refusal_accuracy": 1.0,
            "multi_turn_accuracy": 1.0,
            "by_task": {"single_turn": 1.0},
        }
        provenance = ModelProvenance(
            adapter_checkpoint="checkpoint-80",
            adapter_model_path=Path("/tmp/checkpoint-80"),
            adapter_model_sha256="1" * 64,
            base_model_revision="pinned-revision",
            merged_model_sha256="2" * 64,
            browser_artifact_sha256="3" * 64,
            promoted_checkpoint="checkpoint-80",
            latest_train_loss=0.03125,
            latest_train_step=80,
            best_validation_eval_loss=0.04,
            lora_rank=23,
            lora_alpha=47,
            lora_dropout=0.17,
            lora_target_modules=("k", "o"),
            release_date="2026-08-09",
        )

        with tempfile.TemporaryDirectory() as directory:
            output_path = Path(directory) / "README.md"
            _write_model_card(
                output_path,
                model_repo_id="owner/model",
                dataset_repo_id="owner/dataset",
                baseline_test=report,
                promoted_validation=report,
                promoted_test=report,
                provenance=provenance,
            )
            model_card = output_path.read_text(encoding="utf-8")

        self.assertEqual(BROWSER_PIPELINE_TASK, "text2text-generation")
        self.assertIn(
            f"pipeline_tag: {BROWSER_PIPELINE_TASK}\n",
            model_card,
        )
        self.assertIn(f"`{BROWSER_PIPELINE_TASK}` pipeline.", model_card)
        self.assertIn(f'  "{BROWSER_PIPELINE_TASK}",', model_card)
        self.assertNotIn("pipeline_tag: text-generation\n", model_card)
        self.assertNotIn("official `text-generation` task category", model_card)


if __name__ == "__main__":
    unittest.main()
