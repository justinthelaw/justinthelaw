import tempfile
import unittest
from pathlib import Path

from profile_qa.config import PRIMARY_BASE_MODEL_ID, PRIMARY_BASE_MODEL_REVISION
from profile_qa.train_lora import require_local_model_path, trusted_model_load_kwargs


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


if __name__ == "__main__":
    unittest.main()
