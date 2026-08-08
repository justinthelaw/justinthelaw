from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from profile_qa.prepare_hf_artifacts import BROWSER_PIPELINE_TASK, _write_model_card


class ModelCardMetadataTests(unittest.TestCase):
    def test_model_card_task_matches_browser_deployment(self) -> None:
        report = {
            "macro": 1.0,
            "refusal_accuracy": 1.0,
            "multi_turn_accuracy": 1.0,
            "by_task": {"single_turn": 1.0},
        }

        with tempfile.TemporaryDirectory() as directory:
            output_path = Path(directory) / "README.md"
            _write_model_card(
                output_path,
                model_repo_id="owner/model",
                dataset_repo_id="owner/dataset",
                baseline_test=report,
                promoted_validation=report,
                promoted_test=report,
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
