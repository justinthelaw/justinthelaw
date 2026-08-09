from __future__ import annotations

import argparse
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from profile_qa.config import PRIMARY_BASE_MODEL_ID, PRIMARY_BASE_MODEL_REVISION
from profile_qa.evaluate import (
    GENERATION_CONFIG_FIELD,
    SCORING_DIGEST_FIELD,
    evaluation_provenance,
    score_predictions,
)
from profile_qa.prepare_hf_artifacts import (
    BROWSER_PIPELINE_TASK,
    load_model_provenance,
    prepare_dataset_payload,
    prepare_model_payload,
)
from profile_qa.provenance import (
    ADAPTER_CHECKPOINT_FIELD,
    ADAPTER_DIGEST_FIELD,
    BASE_MODEL_REVISION_FIELD,
    BROWSER_PARENT_ARTIFACT_STAGES,
    DATASET_DIGEST_FIELD,
    EXPECTED_LINEAGE_PIPELINE,
    LINEAGE_SCHEMA_VERSION,
    MERGED_DIGEST_FIELD,
    SOURCE_LINEAGE_DIGEST_FIELD,
    directory_sha256,
    file_sha256,
    public_lineage_sha256,
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
        adapter_config: dict[str, object] | None = None,
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
        (checkpoint_dir / "adapter_config.json").write_text(
            json.dumps(
                adapter_config
                or {
                    "alpha_pattern": {},
                    "base_model_name_or_path": PRIMARY_BASE_MODEL_ID,
                    "bias": "none",
                    "lora_alpha": 47,
                    "lora_dropout": 0.17,
                    "modules_to_save": None,
                    "peft_type": "LORA",
                    "r": 23,
                    "rank_pattern": {},
                    "revision": PRIMARY_BASE_MODEL_REVISION,
                    "target_modules": ["k", "o"],
                    "task_type": "SEQ_2_SEQ_LM",
                    "use_dora": False,
                    "use_rslora": False,
                }
            ),
            encoding="utf-8",
        )
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
        for filename in (
            "encoder_model_int8.onnx",
            "decoder_model_merged_int8.onnx",
            "encoder_model_uint8.onnx",
            "decoder_model_merged_uint8.onnx",
        ):
            (browser_dir / "onnx" / filename).write_bytes(filename.encode())
        write_artifact_lineage(
            browser_dir,
            source_lineage=json.loads(lineage_path.read_text(encoding="utf-8")),
            stage="browser",
            parent_artifact_sha256s={
                "onnx-fp": "1" * 64,
                "onnx-int8": "2" * 64,
                "onnx-uint8": "3" * 64,
            },
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
        split_records = [
            record for record in dataset_records if record.get("split") == split
        ]
        predictions = {
            str(record["id"]): (
                "The public profile does not say."
                if checkpoint_dir is None or record.get("requires_refusal")
                else "grounded answer"
            )
            for record in split_records
        }
        report: dict[str, object] = score_predictions(split_records, predictions)
        model_id = (
            PRIMARY_BASE_MODEL_ID if checkpoint_dir is None else str(checkpoint_dir)
        )
        report["provenance"] = evaluation_provenance(
            model_id,
            split,
            dataset_sha256,
            prompt_sha256,
        )
        if checkpoint_dir is not None and adapter_digest is not None:
            report["provenance"][ADAPTER_DIGEST_FIELD] = adapter_digest
            report["provenance"]["model_sha256"] = adapter_digest
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
            '{"question":"Validation question?","task":"single_turn",'
            '"split":"validation","id":"validation-example"}\n'
            '{"question":"Validation follow-up?","task":"multi_turn",'
            '"split":"validation","id":"validation-multi-turn"}\n'
            '{"question":"Validation private fact?","task":"refusal",'
            '"split":"validation","id":"validation-refusal",'
            '"requires_refusal":true}\n'
            '{"question":"Test question?","task":"single_turn",'
            '"id":"test-example","split":"test"}\n'
            '{"question":"Test follow-up?","task":"multi_turn",'
            '"id":"test-multi-turn","split":"test"}\n'
            '{"question":"Test private fact?","task":"refusal",'
            '"id":"test-refusal","split":"test",'
            '"requires_refusal":true}\n',
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
            private_lineage_digest = file_sha256(lineage_path)
            expected_public_lineage_digest = public_lineage_sha256(
                json.loads(lineage_path.read_text(encoding="utf-8"))
            )
            model_dir = prepare_model_payload(args)
            model_card = (model_dir / "README.md").read_text(encoding="utf-8")
            published_lineage = validate_artifact_lineage(
                model_dir,
                source_lineage=json.loads(
                    lineage_path.read_text(encoding="utf-8")
                ),
                stage="browser",
                required_parent_stages=BROWSER_PARENT_ARTIFACT_STAGES,
            )

        self.assertIn("Promoted checkpoint: `checkpoint-80`", model_card)
        self.assertEqual(BROWSER_PIPELINE_TASK, "text2text-generation")
        self.assertIn(f"pipeline_tag: {BROWSER_PIPELINE_TASK}", model_card)
        self.assertIn(f'  "{BROWSER_PIPELINE_TASK}",', model_card)
        self.assertNotIn("pipeline_tag: text-generation", model_card)
        self.assertIn("Latest recorded train loss: 0.0312 at step 80", model_card)
        self.assertIn("Best recorded validation eval loss: 0.0400", model_card)
        self.assertIn("LoRA: rank 23, alpha 47,", model_card)
        self.assertIn("dropout 0.17, target modules", model_card)
        self.assertIn("`k`, `o`", model_card)
        self.assertNotIn("rank 16, alpha 32, dropout 0.03", model_card)
        self.assertNotIn("batch size 1", model_card)
        self.assertNotIn("4-bit base loading", model_card)
        self.assertNotIn("cloud training", model_card)
        self.assertIn("2026-08-07: Browser profile-QA export", model_card)
        self.assertIn(PRIMARY_BASE_MODEL_REVISION, model_card)
        self.assertIn(expected_browser_digest, model_card)
        self.assertEqual(published_lineage["artifact_sha256"], expected_browser_digest)
        self.assertNotIn("adapter_model_id", published_lineage)
        self.assertEqual(
            published_lineage[SOURCE_LINEAGE_DIGEST_FIELD],
            expected_public_lineage_digest,
        )
        self.assertNotEqual(
            published_lineage[SOURCE_LINEAGE_DIGEST_FIELD],
            private_lineage_digest,
        )
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

    def test_unverifiable_lora_configuration_fails_clearly(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            lineage_path, _ = self._write_lineage(
                root,
                adapter_config={
                    "alpha_pattern": {},
                    "base_model_name_or_path": PRIMARY_BASE_MODEL_ID,
                    "bias": "none",
                    "lora_alpha": 32,
                    "lora_dropout": 0.03,
                    "modules_to_save": None,
                    "peft_type": "LORA",
                    "r": 16,
                    "rank_pattern": {},
                    "revision": PRIMARY_BASE_MODEL_REVISION,
                    "target_modules": ["q", "v"],
                    "use_dora": False,
                    "use_rslora": False,
                    # No task_type: the card must not guess this claim.
                },
            )
            browser_dir = self._write_browser_artifact(root, lineage_path)

            with self.assertRaisesRegex(ValueError, "task_type"):
                load_model_provenance(
                    lineage_path,
                    browser_dir,
                    "2026-08-07",
                )

    def test_per_module_lora_overrides_are_not_flattened_into_card_claims(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            lineage_path, checkpoint_dir = self._write_lineage(root)
            adapter_config_path = checkpoint_dir / "adapter_config.json"
            adapter_config = json.loads(
                adapter_config_path.read_text(encoding="utf-8")
            )
            adapter_config["rank_pattern"] = {"encoder.block.0.q": 7}
            adapter_config_path.write_text(
                json.dumps(adapter_config),
                encoding="utf-8",
            )
            lineage = json.loads(lineage_path.read_text(encoding="utf-8"))
            lineage[ADAPTER_DIGEST_FIELD] = directory_sha256(checkpoint_dir)
            lineage_path.write_text(json.dumps(lineage), encoding="utf-8")
            browser_dir = self._write_browser_artifact(root, lineage_path)

            with self.assertRaisesRegex(ValueError, "rank_pattern"):
                load_model_provenance(
                    lineage_path,
                    browser_dir,
                    "2026-08-07",
                )

    def test_checkpoint_training_revision_must_match_release_base(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            lineage_path, checkpoint_dir = self._write_lineage(root)
            adapter_config_path = checkpoint_dir / "adapter_config.json"
            adapter_config = json.loads(
                adapter_config_path.read_text(encoding="utf-8")
            )
            adapter_config["revision"] = "0" * 40
            adapter_config_path.write_text(
                json.dumps(adapter_config),
                encoding="utf-8",
            )
            lineage = json.loads(lineage_path.read_text(encoding="utf-8"))
            lineage[ADAPTER_DIGEST_FIELD] = directory_sha256(checkpoint_dir)
            lineage_path.write_text(json.dumps(lineage), encoding="utf-8")
            browser_dir = self._write_browser_artifact(root, lineage_path)

            with self.assertRaisesRegex(RuntimeError, "revision must be"):
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

    def test_missing_advertised_browser_variant_preserves_existing_payload(self) -> None:
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
            (browser_dir / "onnx" / "encoder_model_uint8.onnx").unlink()
            write_artifact_lineage(
                browser_dir,
                source_lineage=json.loads(
                    lineage_path.read_text(encoding="utf-8")
                ),
                stage="browser",
                parent_artifact_sha256s={
                    "onnx-fp": "1" * 64,
                    "onnx-int8": "2" * 64,
                    "onnx-uint8": "3" * 64,
                },
            )
            model_output_dir = root / "hf" / "model"
            model_output_dir.mkdir(parents=True)
            sentinel = model_output_dir / "keep.txt"
            sentinel.write_text("unchanged", encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "missing published ONNX"):
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
            (selected_checkpoint / "adapter_model.safetensors").write_bytes(
                b"different adapter"
            )
            selected_lineage_data = json.loads(
                selected_lineage.read_text(encoding="utf-8")
            )
            selected_lineage_data[ADAPTER_DIGEST_FIELD] = directory_sha256(
                selected_checkpoint
            )
            selected_lineage.write_text(
                json.dumps(selected_lineage_data),
                encoding="utf-8",
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

    def test_promoted_reports_must_use_one_model_representation(self) -> None:
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
            test_report_path = Path(args.test_report)
            test_report = json.loads(test_report_path.read_text(encoding="utf-8"))
            test_report["provenance"]["model_kind"] = "merged"
            test_report["provenance"]["model_id"] = "merged-model"
            test_report["provenance"]["model_sha256"] = "1" * 64
            test_report_path.write_text(json.dumps(test_report), encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "same model representation"):
                prepare_model_payload(args)

            with self.assertRaisesRegex(ValueError, "same model representation"):
                prepare_dataset_payload(args)

    def test_report_provenance_cannot_publish_private_adapter_path(self) -> None:
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
            report["provenance"]["adapter_model_id"] = str(checkpoint_dir)
            report_path.write_text(json.dumps(report), encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "non-publishable provenance"):
                prepare_model_payload(args)

            with self.assertRaisesRegex(ValueError, "non-publishable provenance"):
                prepare_dataset_payload(args)

    def test_report_root_cannot_publish_private_metadata(self) -> None:
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
            report["adapter_model_id"] = str(checkpoint_dir)
            report_path.write_text(json.dumps(report), encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "non-publishable fields"):
                prepare_dataset_payload(args)

    def test_report_provenance_requires_the_complete_publishable_schema(self) -> None:
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
            del report["provenance"][BASE_MODEL_REVISION_FIELD]
            report_path.write_text(json.dumps(report), encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "missing required provenance"):
                prepare_model_payload(args)

            with self.assertRaisesRegex(ValueError, "missing required provenance"):
                prepare_dataset_payload(args)

    def test_dataset_reports_reject_private_model_id_values(self) -> None:
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
            private_model_id = str(checkpoint_dir.resolve())
            for report_name in (args.validation_report, args.test_report):
                report_path = Path(report_name)
                report = json.loads(report_path.read_text(encoding="utf-8"))
                report["provenance"]["model_id"] = private_model_id
                report_path.write_text(json.dumps(report), encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "model_id must be"):
                prepare_dataset_payload(args)

    def test_dataset_baseline_slot_rejects_a_promoted_report(self) -> None:
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
            baseline_path = Path(args.baseline_report)
            baseline_report = json.loads(baseline_path.read_text(encoding="utf-8"))
            promoted_test = json.loads(
                Path(args.test_report).read_text(encoding="utf-8")
            )
            baseline_report["provenance"] = promoted_test["provenance"]
            baseline_path.write_text(json.dumps(baseline_report), encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "baseline model"):
                prepare_dataset_payload(args)

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

    def test_report_from_stale_scoring_implementation_is_rejected(self) -> None:
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
            report_path = Path(args.test_report)
            report = json.loads(report_path.read_text(encoding="utf-8"))
            report["provenance"][SCORING_DIGEST_FIELD] = "f" * 64
            report_path.write_text(json.dumps(report), encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "scoring implementation"):
                prepare_model_payload(args)

    def test_report_from_stale_generation_configuration_is_rejected(self) -> None:
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
            report_path = Path(args.test_report)
            report = json.loads(report_path.read_text(encoding="utf-8"))
            report["provenance"][GENERATION_CONFIG_FIELD]["max_new_tokens"] = 80
            report_path.write_text(json.dumps(report), encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "generation configuration"):
                prepare_model_payload(args)

    def test_report_scores_are_recomputed_from_saved_predictions(self) -> None:
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
            report["macro"] = 0.123
            report_path.write_text(json.dumps(report), encoding="utf-8")

            with self.assertRaisesRegex(ValueError, "saved predictions"):
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

    def test_release_preflight_preserves_dataset_nested_in_model_output(self) -> None:
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
            nested_dataset = root / "hf" / "model" / "inputs" / "profile_qa.jsonl"
            nested_dataset.parent.mkdir(parents=True)
            Path(args.dataset).replace(nested_dataset)
            args.dataset = str(nested_dataset)
            source_bytes = nested_dataset.read_bytes()

            with self.assertRaisesRegex(ValueError, "must not overlap release input"):
                prepare_model_payload(args)

            self.assertEqual(nested_dataset.read_bytes(), source_bytes)

    def test_release_preflight_preserves_adapter_under_dataset_output(self) -> None:
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
            nested_checkpoint = root / "hf" / "dataset" / checkpoint_dir.name
            nested_checkpoint.parent.mkdir(parents=True)
            checkpoint_dir.replace(nested_checkpoint)
            lineage = json.loads(lineage_path.read_text(encoding="utf-8"))
            lineage["adapter_model_id"] = str(nested_checkpoint.resolve())
            lineage_path.write_text(json.dumps(lineage), encoding="utf-8")
            trainer_state = nested_checkpoint / "trainer_state.json"
            source_bytes = trainer_state.read_bytes()

            with self.assertRaisesRegex(ValueError, "must not overlap release input"):
                prepare_dataset_payload(args)

            self.assertEqual(trainer_state.read_bytes(), source_bytes)

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
