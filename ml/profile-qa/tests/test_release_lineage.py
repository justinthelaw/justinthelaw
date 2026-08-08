from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from profile_qa.config import PRIMARY_BASE_MODEL_ID, PRIMARY_BASE_MODEL_REVISION
from profile_qa.evaluate import (
    evaluation_provenance,
    load_prediction_bundle,
    write_prediction_bundle,
)
from profile_qa.export_onnx import (
    assemble_browser_artifact,
    ensure_teapot_export_model,
)
from profile_qa.provenance import (
    ADAPTER_CHECKPOINT_FIELD,
    ADAPTER_DIGEST_FIELD,
    BASE_MODEL_REVISION_FIELD,
    DATASET_DIGEST_FIELD,
    EXPECTED_LINEAGE_PIPELINE,
    LINEAGE_FILENAME,
    LINEAGE_SCHEMA_VERSION,
    MERGED_DIGEST_FIELD,
    PROMPT_DIGEST_FIELD,
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
            ADAPTER_CHECKPOINT_FIELD: adapter_dir.name,
            ADAPTER_DIGEST_FIELD: directory_sha256(adapter_dir),
            "base_model": PRIMARY_BASE_MODEL_ID,
            BASE_MODEL_REVISION_FIELD: PRIMARY_BASE_MODEL_REVISION,
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
            merged_dir, adapter_dir = self._write_merged_model(root)
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

            self.assertNotIn("adapter_model_id", marker)
            self.assertEqual(marker[ADAPTER_CHECKPOINT_FIELD], adapter_dir.name)
            self.assertEqual(marker[MERGED_DIGEST_FIELD], lineage.data[MERGED_DIGEST_FIELD])
            self.assertTrue((browser_dir / LINEAGE_FILENAME).is_file())

    def test_artifact_lineage_rejects_injected_local_path(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            merged_dir, adapter_dir = self._write_merged_model(root)
            lineage = ensure_teapot_export_model(str(merged_dir))
            artifact_dir = root / "browser"
            artifact_dir.mkdir()
            (artifact_dir / "model.onnx").write_bytes(b"model")
            marker_path = write_artifact_lineage(
                artifact_dir,
                source_lineage=lineage.data,
                source_lineage_sha256=lineage.sha256,
                stage="browser",
            )
            marker = json.loads(marker_path.read_text(encoding="utf-8"))
            marker["adapter_model_id"] = str(adapter_dir.resolve())
            marker_path.write_text(json.dumps(marker), encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "non-publishable fields"):
                validate_artifact_lineage(
                    artifact_dir,
                    source_lineage_sha256=lineage.sha256,
                    stage="browser",
                )

    def test_merged_model_tampering_breaks_lineage_validation(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            merged_dir, _ = self._write_merged_model(Path(directory))
            (merged_dir / "model.safetensors").write_bytes(b"tampered")

            with self.assertRaisesRegex(RuntimeError, "merged model digest"):
                ensure_teapot_export_model(str(merged_dir))

    def test_merge_lineage_from_another_base_revision_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            merged_dir, _ = self._write_merged_model(Path(directory))
            lineage_path = merged_dir / LINEAGE_FILENAME
            lineage = json.loads(lineage_path.read_text(encoding="utf-8"))
            lineage[BASE_MODEL_REVISION_FIELD] = "0" * 40
            lineage_path.write_text(json.dumps(lineage), encoding="utf-8")

            with self.assertRaisesRegex(RuntimeError, BASE_MODEL_REVISION_FIELD):
                ensure_teapot_export_model(str(merged_dir))

    def test_evaluation_provenance_identifies_baseline_revision(self) -> None:
        provenance = evaluation_provenance(
            PRIMARY_BASE_MODEL_ID,
            "test",
            "d" * 64,
            "e" * 64,
        )

        self.assertEqual(provenance["model_kind"], "baseline")
        self.assertEqual(
            provenance[BASE_MODEL_REVISION_FIELD],
            PRIMARY_BASE_MODEL_REVISION,
        )
        self.assertEqual(provenance[DATASET_DIGEST_FIELD], "d" * 64)
        self.assertEqual(provenance[PROMPT_DIGEST_FIELD], "e" * 64)
        self.assertEqual(provenance["split"], "test")

    def test_evaluation_provenance_hashes_selected_adapter(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            _, adapter_dir = self._write_merged_model(Path(directory))

            provenance = evaluation_provenance(
                str(adapter_dir),
                "validation",
                "d" * 64,
                "e" * 64,
            )

            self.assertEqual(provenance["model_kind"], "adapter")
            self.assertEqual(provenance[ADAPTER_CHECKPOINT_FIELD], adapter_dir.name)
            self.assertNotIn("adapter_model_id", provenance)
            self.assertEqual(
                provenance[ADAPTER_DIGEST_FIELD],
                directory_sha256(adapter_dir),
            )
            self.assertEqual(provenance["split"], "validation")

    def test_evaluation_provenance_rejects_nonportable_checkpoint_label(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            adapter_dir = root / "checkpoint with spaces"
            adapter_dir.mkdir()
            (adapter_dir / "adapter_config.json").write_text(
                json.dumps({"base_model_name_or_path": PRIMARY_BASE_MODEL_ID}),
                encoding="utf-8",
            )

            with self.assertRaisesRegex(ValueError, "portable ASCII label"):
                evaluation_provenance(
                    str(adapter_dir),
                    "test",
                    "d" * 64,
                    "e" * 64,
                )

    def test_evaluation_provenance_preserves_merged_adapter_lineage(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            merged_dir, adapter_dir = self._write_merged_model(Path(directory))

            provenance = evaluation_provenance(
                str(merged_dir),
                "test",
                "d" * 64,
                "e" * 64,
            )

            self.assertEqual(provenance["model_kind"], "merged")
            self.assertEqual(provenance[ADAPTER_CHECKPOINT_FIELD], adapter_dir.name)
            self.assertNotIn("adapter_model_id", provenance)
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

    def test_saved_predictions_require_matching_model_provenance(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            _, adapter_dir = self._write_merged_model(root)
            records = [{"id": "example"}]
            provenance = evaluation_provenance(
                str(adapter_dir),
                "test",
                "d" * 64,
                "e" * 64,
            )
            bundle_path = root / "predictions.json"
            write_prediction_bundle(
                bundle_path,
                predictions={"example": "saved answer"},
                provenance=provenance,
            )
            stale_bundle = json.loads(bundle_path.read_text(encoding="utf-8"))
            stale_bundle["provenance"][ADAPTER_DIGEST_FIELD] = "f" * 64
            stale_bundle["provenance"]["model_sha256"] = "f" * 64
            bundle_path.write_text(json.dumps(stale_bundle), encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "prediction provenance"):
                load_prediction_bundle(
                    bundle_path,
                    expected_provenance=provenance,
                    records=records,
                )

    def test_saved_predictions_round_trip_with_exact_record_ids(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            bundle_path = Path(directory) / "predictions.json"
            records = [{"id": "first"}, {"id": "second"}]
            provenance = evaluation_provenance(
                PRIMARY_BASE_MODEL_ID,
                "test",
                "d" * 64,
                "e" * 64,
            )
            predictions = {"first": "one", "second": "two"}
            write_prediction_bundle(
                bundle_path,
                predictions=predictions,
                provenance=provenance,
            )

            self.assertEqual(
                load_prediction_bundle(
                    bundle_path,
                    expected_provenance=provenance,
                    records=records,
                ),
                predictions,
            )

    def test_plain_saved_prediction_mapping_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            bundle_path = Path(directory) / "predictions.json"
            bundle_path.write_text(
                json.dumps({"example": "unbound answer"}),
                encoding="utf-8",
            )
            provenance = evaluation_provenance(
                PRIMARY_BASE_MODEL_ID,
                "test",
                "d" * 64,
                "e" * 64,
            )

            with self.assertRaisesRegex(ValueError, "missing object field 'provenance'"):
                load_prediction_bundle(
                    bundle_path,
                    expected_provenance=provenance,
                    records=[{"id": "example"}],
                )


if __name__ == "__main__":
    unittest.main()
