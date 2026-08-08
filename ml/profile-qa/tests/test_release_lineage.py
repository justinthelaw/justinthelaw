from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from profile_qa.config import PRIMARY_BASE_MODEL_ID, PRIMARY_BASE_MODEL_REVISION
from profile_qa.evaluate import evaluation_provenance
from profile_qa.export_onnx import (
    assemble_browser_artifact,
    ensure_teapot_export_model,
)
from profile_qa.provenance import (
    ADAPTER_DIGEST_FIELD,
    EXPECTED_LINEAGE_PIPELINE,
    LINEAGE_FILENAME,
    LINEAGE_SCHEMA_VERSION,
    MERGED_DIGEST_FIELD,
    directory_sha256,
    validate_artifact_lineage,
    write_artifact_lineage,
)


class ReleaseLineageTests(unittest.TestCase):
    def _write_merged_model(self, root: Path) -> tuple[Path, Path]:
        adapter_dir = root / "checkpoint-80"
        adapter_dir.mkdir()
        (adapter_dir / "adapter_config.json").write_text(
            json.dumps({"base_model_name_or_path": PRIMARY_BASE_MODEL_ID}),
            encoding="utf-8",
        )
        (adapter_dir / "adapter_model.safetensors").write_bytes(b"adapter")

        merged_dir = root / "merged"
        merged_dir.mkdir()
        (merged_dir / "config.json").write_text("{}", encoding="utf-8")
        (merged_dir / "model.safetensors").write_bytes(b"merged")
        lineage = {
            "schema_version": LINEAGE_SCHEMA_VERSION,
            "adapter_model_id": str(adapter_dir.resolve()),
            ADAPTER_DIGEST_FIELD: directory_sha256(adapter_dir),
            "base_model": PRIMARY_BASE_MODEL_ID,
            "pipeline": EXPECTED_LINEAGE_PIPELINE,
            MERGED_DIGEST_FIELD: directory_sha256(merged_dir),
        }
        (merged_dir / LINEAGE_FILENAME).write_text(
            json.dumps(lineage, indent=2, sort_keys=True),
            encoding="utf-8",
        )
        return merged_dir, adapter_dir

    def _write_onnx_stage(
        self,
        directory: Path,
        *,
        lineage_data: dict[str, object],
        lineage_sha256: str,
        stage: str,
    ) -> None:
        directory.mkdir(parents=True)
        (directory / "encoder_model.onnx").write_bytes(f"{stage}-encoder".encode())
        (directory / "decoder_model_merged.onnx").write_bytes(
            f"{stage}-decoder".encode()
        )
        if stage == "onnx-fp":
            (directory / "config.json").write_text("{}", encoding="utf-8")
        write_artifact_lineage(
            directory,
            source_lineage=lineage_data,
            source_lineage_sha256=lineage_sha256,
            stage=stage,
        )

    def test_browser_export_preserves_verified_lineage_and_digest(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            merged_dir, _ = self._write_merged_model(root)
            lineage = ensure_teapot_export_model(str(merged_dir))
            fp_dir = root / "onnx"
            int8_dir = root / "int8"
            uint8_dir = root / "uint8"
            self._write_onnx_stage(
                fp_dir,
                lineage_data=lineage.data,
                lineage_sha256=lineage.sha256,
                stage="onnx-fp",
            )
            self._write_onnx_stage(
                int8_dir,
                lineage_data=lineage.data,
                lineage_sha256=lineage.sha256,
                stage="onnx-int8",
            )
            self._write_onnx_stage(
                uint8_dir,
                lineage_data=lineage.data,
                lineage_sha256=lineage.sha256,
                stage="onnx-uint8",
            )
            browser_dir = root / "browser"

            assemble_browser_artifact(
                fp_dir,
                {"int8": int8_dir, "uint8": uint8_dir},
                browser_dir,
                lineage,
            )
            marker = validate_artifact_lineage(
                browser_dir,
                source_lineage_sha256=lineage.sha256,
                stage="browser",
            )

            self.assertEqual(marker["adapter_model_id"], lineage.data["adapter_model_id"])
            self.assertEqual(marker[MERGED_DIGEST_FIELD], lineage.data[MERGED_DIGEST_FIELD])
            self.assertTrue((browser_dir / LINEAGE_FILENAME).is_file())

    def test_merged_model_tampering_breaks_lineage_validation(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            merged_dir, _ = self._write_merged_model(Path(directory))
            (merged_dir / "model.safetensors").write_bytes(b"tampered")

            with self.assertRaisesRegex(RuntimeError, "merged model digest"):
                ensure_teapot_export_model(str(merged_dir))

    def test_evaluation_provenance_identifies_baseline_revision(self) -> None:
        provenance = evaluation_provenance(PRIMARY_BASE_MODEL_ID, "test")

        self.assertEqual(provenance["model_kind"], "baseline")
        self.assertEqual(provenance["model_revision"], PRIMARY_BASE_MODEL_REVISION)
        self.assertEqual(provenance["split"], "test")

    def test_evaluation_provenance_hashes_selected_adapter(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            _, adapter_dir = self._write_merged_model(Path(directory))

            provenance = evaluation_provenance(str(adapter_dir), "validation")

            self.assertEqual(provenance["model_kind"], "adapter")
            self.assertEqual(provenance["adapter_model_id"], str(adapter_dir.resolve()))
            self.assertEqual(
                provenance[ADAPTER_DIGEST_FIELD],
                directory_sha256(adapter_dir),
            )
            self.assertEqual(provenance["split"], "validation")

    def test_evaluation_provenance_preserves_merged_adapter_lineage(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            merged_dir, adapter_dir = self._write_merged_model(Path(directory))

            provenance = evaluation_provenance(str(merged_dir), "test")

            self.assertEqual(provenance["model_kind"], "merged")
            self.assertEqual(provenance["adapter_model_id"], str(adapter_dir.resolve()))
            self.assertEqual(
                provenance[ADAPTER_DIGEST_FIELD],
                directory_sha256(adapter_dir),
            )
            self.assertEqual(
                provenance["model_sha256"],
                directory_sha256(
                    merged_dir,
                    excluded_relative_paths=frozenset({LINEAGE_FILENAME}),
                ),
            )


if __name__ == "__main__":
    unittest.main()
