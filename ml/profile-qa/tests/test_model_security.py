import json
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace

from profile_qa.config import PRIMARY_BASE_MODEL_ID, PRIMARY_BASE_MODEL_REVISION
from profile_qa.train_lora import (
    ensure_adapter_base_lineage,
    require_local_model_path,
    resolve_resume_checkpoint,
    run_training,
    trusted_model_load_kwargs,
)


class ModelSecurityTests(unittest.TestCase):
    def test_primary_model_is_pinned_and_disables_remote_code(self) -> None:
        self.assertEqual(
            trusted_model_load_kwargs(PRIMARY_BASE_MODEL_ID),
            {
                "revision": PRIMARY_BASE_MODEL_REVISION,
                "trust_remote_code": False,
            },
        )

    def test_local_model_loads_offline_without_remote_code(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            self.assertEqual(require_local_model_path(directory, source="test"), Path(directory))
            self.assertEqual(
                trusted_model_load_kwargs(directory),
                {
                    "local_files_only": True,
                    "trust_remote_code": False,
                },
            )

    def test_arbitrary_remote_model_is_rejected(self) -> None:
        with self.assertRaisesRegex(RuntimeError, "trusted local directory"):
            trusted_model_load_kwargs("untrusted/model-repository")

    def test_adapter_lineage_requires_pinned_training_revision(self) -> None:
        valid_config = {
            "base_model_name_or_path": PRIMARY_BASE_MODEL_ID,
            "revision": PRIMARY_BASE_MODEL_REVISION,
        }
        ensure_adapter_base_lineage(valid_config, source="test adapter")

        for revision in (None, "0" * 40):
            with (
                self.subTest(revision=revision),
                self.assertRaisesRegex(RuntimeError, "revision must be"),
            ):
                ensure_adapter_base_lineage(
                    {
                        "base_model_name_or_path": PRIMARY_BASE_MODEL_ID,
                        "revision": revision,
                    },
                    source="test adapter",
                )

    def test_resume_uses_latest_revision_bound_checkpoint(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            output_dir = Path(directory)
            for step in (40, 80):
                checkpoint_dir = output_dir / f"checkpoint-{step}"
                checkpoint_dir.mkdir()
                (checkpoint_dir / "adapter_config.json").write_text(
                    json.dumps(
                        {
                            "base_model_name_or_path": PRIMARY_BASE_MODEL_ID,
                            "revision": PRIMARY_BASE_MODEL_REVISION,
                        }
                    ),
                    encoding="utf-8",
                )

            self.assertEqual(
                resolve_resume_checkpoint(output_dir),
                output_dir / "checkpoint-80",
            )

    def test_resume_rejects_stale_latest_checkpoint_revision(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            output_dir = Path(directory)
            checkpoint_dir = output_dir / "checkpoint-80"
            checkpoint_dir.mkdir()
            (checkpoint_dir / "adapter_config.json").write_text(
                json.dumps(
                    {
                        "base_model_name_or_path": PRIMARY_BASE_MODEL_ID,
                        "revision": "0" * 40,
                    }
                ),
                encoding="utf-8",
            )

            with self.assertRaisesRegex(RuntimeError, "revision must be"):
                resolve_resume_checkpoint(output_dir)

    def test_resume_and_adapter_continuation_are_mutually_exclusive(self) -> None:
        args = SimpleNamespace(resume=True, adapter_model_id="checkpoint-40")

        with self.assertRaisesRegex(RuntimeError, "use exactly one"):
            run_training(args)


if __name__ == "__main__":
    unittest.main()
