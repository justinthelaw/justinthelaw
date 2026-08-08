"""Prepare Hugging Face model and dataset repository payloads."""

from __future__ import annotations

import argparse
import json
import math
import shutil
from collections import Counter
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any

from .config import (
    DEFAULT_DATASET_PATH,
    ONNX_DIR,
    PACKAGE_ROOT,
    PRIMARY_BASE_MODEL_ID,
    PRIMARY_BASE_MODEL_REVISION,
    REPORT_DIR,
)
from .evaluate import (
    EVALUATION_REPORT_FIELDS,
    GENERATION_CONFIG_FIELD,
    GENERATION_DIGEST_FIELD,
    GENERATION_SCHEMA_FIELD,
    GENERATION_SCHEMA_VERSION,
    SCORING_DIGEST_FIELD,
    SCORING_SCHEMA_FIELD,
    SCORING_SCHEMA_VERSION,
    evaluation_provenance_fields,
    generation_config,
    generation_implementation_sha256,
    score_predictions,
    scoring_implementation_sha256,
)
from .export_onnx import reject_external_data_files
from .provenance import (
    ADAPTER_CHECKPOINT_FIELD,
    ADAPTER_DIGEST_FIELD,
    ARTIFACT_DIGEST_FIELD,
    BASE_MODEL_REVISION_FIELD,
    BROWSER_PARENT_ARTIFACT_STAGES,
    DATASET_DIGEST_FIELD,
    EXPECTED_LINEAGE_PIPELINE,
    LINEAGE_FILENAME,
    LINEAGE_SCHEMA_VERSION,
    MERGED_DIGEST_FIELD,
    PROMPT_DIGEST_FIELD,
    SOURCE_LINEAGE_DIGEST_FIELD,
    directory_sha256,
    load_json_object,
    public_lineage_fields,
    public_lineage_sha256,
    require_checkpoint_label,
    require_sha256,
    validate_artifact_lineage,
)
from .public_profile import PROFILE_SECTIONS
from .train_lora import (
    ADAPTER_CONFIG_FILENAME,
    ensure_adapter_base_lineage,
    evaluation_prompt_sha256,
)
from .validation import canonical_jsonl_sha256, read_jsonl, write_jsonl

DEFAULT_MODEL_REPO_ID = "justinthelaw/teapot-profile-qa-browser-1024"
DEFAULT_DATASET_REPO_ID = "justinthelaw/profile-qa-synthetic-public-v1"
TRAINER_STATE_FILENAME = "trainer_state.json"
BROWSER_ONNX_FILENAMES = (
    "encoder_model_int8.onnx",
    "decoder_model_merged_int8.onnx",
    "encoder_model_uint8.onnx",
    "decoder_model_merged_uint8.onnx",
)


@dataclass(frozen=True)
class ModelProvenance:
    adapter_checkpoint: str
    adapter_model_sha256: str
    base_model_revision: str
    merged_model_sha256: str
    browser_artifact_sha256: str
    promoted_checkpoint: str
    latest_train_loss: float
    latest_train_step: int
    best_validation_eval_loss: float
    lora_rank: int
    lora_alpha: float
    lora_dropout: float
    lora_target_modules: tuple[str, ...]
    release_date: str


@dataclass(frozen=True)
class EvaluationReports:
    baseline_test: dict[str, Any]
    promoted_validation: dict[str, Any]
    promoted_test: dict[str, Any]


def _load_json_object(path: Path, *, label: str) -> dict[str, Any]:
    return load_json_object(path, label=label)


def _required_text(value: Any, *, field: str, source: Path) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{source} is missing non-empty string field {field!r}")
    return value.strip()


def _loss_value(value: Any, *, field: str, source: Path) -> float:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{source} field {field!r} must be a number, got {value!r}")
    loss = float(value)
    if not math.isfinite(loss) or loss < 0:
        raise ValueError(
            f"{source} field {field!r} must be a finite non-negative number, "
            f"got {value!r}"
        )
    return loss


def _training_losses(
    trainer_state: dict[str, Any],
    *,
    source: Path,
) -> tuple[float, int, float]:
    log_history = trainer_state.get("log_history")
    if not isinstance(log_history, list):
        raise ValueError(f"{source} is missing list field 'log_history'")

    training_entries: list[tuple[int, int, float]] = []
    validation_losses: list[float] = []
    for index, entry in enumerate(log_history):
        if not isinstance(entry, dict):
            continue
        if "loss" in entry:
            step = entry.get("step")
            if isinstance(step, bool) or not isinstance(step, int) or step < 0:
                raise ValueError(
                    f"{source} training loss entry has invalid step {step!r}"
                )
            training_entries.append(
                (
                    step,
                    index,
                    _loss_value(entry["loss"], field="loss", source=source),
                )
            )
        if "eval_loss" in entry:
            validation_losses.append(
                _loss_value(
                    entry["eval_loss"],
                    field="eval_loss",
                    source=source,
                )
            )

    if not training_entries:
        raise ValueError(f"{source} does not contain a recorded training loss")
    if not validation_losses:
        raise ValueError(f"{source} does not contain a recorded validation eval loss")

    latest_step, _, latest_train_loss = max(training_entries)
    return latest_train_loss, latest_step, min(validation_losses)


def _lora_configuration(
    adapter_config: dict[str, Any],
    *,
    source: Path,
) -> tuple[int, float, float, tuple[str, ...]]:
    """Validate model-card LoRA claims from the digest-bound PEFT config."""

    if adapter_config.get("peft_type") != "LORA":
        raise ValueError(f"{source} field 'peft_type' must be 'LORA'")
    if adapter_config.get("task_type") != "SEQ_2_SEQ_LM":
        raise ValueError(f"{source} field 'task_type' must be 'SEQ_2_SEQ_LM'")
    simple_lora_fields: dict[str, Any] = {
        "alpha_pattern": {},
        "bias": "none",
        "modules_to_save": None,
        "rank_pattern": {},
        "use_dora": False,
        "use_rslora": False,
    }
    unsupported_fields = [
        field
        for field, expected_value in simple_lora_fields.items()
        if field not in adapter_config or adapter_config[field] != expected_value
    ]
    if unsupported_fields:
        raise ValueError(
            f"{source} does not describe the simple LoRA shape supported by the "
            "generated model card; unsupported or missing fields: "
            f"{', '.join(unsupported_fields)}"
        )

    rank = adapter_config.get("r")
    if isinstance(rank, bool) or not isinstance(rank, int) or rank <= 0:
        raise ValueError(f"{source} field 'r' must be a positive integer")

    alpha_value = adapter_config.get("lora_alpha")
    if isinstance(alpha_value, bool) or not isinstance(alpha_value, (int, float)):
        raise ValueError(f"{source} field 'lora_alpha' must be a positive number")
    alpha = float(alpha_value)
    if not math.isfinite(alpha) or alpha <= 0:
        raise ValueError(f"{source} field 'lora_alpha' must be a positive number")

    dropout_value = adapter_config.get("lora_dropout")
    if isinstance(dropout_value, bool) or not isinstance(dropout_value, (int, float)):
        raise ValueError(
            f"{source} field 'lora_dropout' must be a number from 0 through 1"
        )
    dropout = float(dropout_value)
    if not math.isfinite(dropout) or not 0 <= dropout <= 1:
        raise ValueError(
            f"{source} field 'lora_dropout' must be a number from 0 through 1"
        )

    raw_target_modules = adapter_config.get("target_modules")
    if (
        not isinstance(raw_target_modules, list)
        or not raw_target_modules
        or any(
            not isinstance(module, str) or not module.strip()
            for module in raw_target_modules
        )
    ):
        raise ValueError(
            f"{source} field 'target_modules' must be a non-empty list of strings"
        )
    target_modules = tuple(sorted(raw_target_modules))
    if len(set(target_modules)) != len(target_modules):
        raise ValueError(
            f"{source} field 'target_modules' must contain unique non-empty strings"
        )
    return rank, alpha, dropout, target_modules


def load_model_provenance(
    lineage_path: Path,
    browser_dir: Path,
    release_date: str | None,
) -> ModelProvenance:
    """Load and validate model-card provenance from release inputs."""

    if not isinstance(release_date, str) or not release_date.strip():
        raise ValueError(
            "release date is required; pass --release-date in YYYY-MM-DD format"
        )
    normalized_release_date = release_date.strip()
    try:
        parsed_release_date = date.fromisoformat(normalized_release_date)
    except ValueError as exc:
        raise ValueError("release date must use YYYY-MM-DD format") from exc
    if parsed_release_date.isoformat() != normalized_release_date:
        raise ValueError("release date must use YYYY-MM-DD format")

    lineage = _load_json_object(lineage_path, label="model lineage")
    if lineage.get("schema_version") != LINEAGE_SCHEMA_VERSION:
        raise ValueError(
            f"{lineage_path} field 'schema_version' must be "
            f"{LINEAGE_SCHEMA_VERSION}"
        )
    adapter_model_id = _required_text(
        lineage.get("adapter_model_id"),
        field="adapter_model_id",
        source=lineage_path,
    )
    adapter_checkpoint = require_checkpoint_label(
        lineage.get(ADAPTER_CHECKPOINT_FIELD),
        source=lineage_path,
    )
    base_model = _required_text(
        lineage.get("base_model"),
        field="base_model",
        source=lineage_path,
    )
    if base_model != PRIMARY_BASE_MODEL_ID:
        raise ValueError(
            f"{lineage_path} field 'base_model' must be {PRIMARY_BASE_MODEL_ID!r}, "
            f"got {base_model!r}"
        )
    base_model_revision = _required_text(
        lineage.get(BASE_MODEL_REVISION_FIELD),
        field=BASE_MODEL_REVISION_FIELD,
        source=lineage_path,
    )
    if base_model_revision != PRIMARY_BASE_MODEL_REVISION:
        raise ValueError(
            f"{lineage_path} field {BASE_MODEL_REVISION_FIELD!r} must be "
            f"{PRIMARY_BASE_MODEL_REVISION!r}, got {base_model_revision!r}"
        )
    pipeline_name = _required_text(
        lineage.get("pipeline"),
        field="pipeline",
        source=lineage_path,
    )
    if pipeline_name != EXPECTED_LINEAGE_PIPELINE:
        raise ValueError(
            f"{lineage_path} field 'pipeline' must be "
            f"{EXPECTED_LINEAGE_PIPELINE!r}, got {pipeline_name!r}"
        )

    adapter_model_sha256 = require_sha256(
        lineage.get(ADAPTER_DIGEST_FIELD),
        field=ADAPTER_DIGEST_FIELD,
        source=lineage_path,
    )
    merged_model_sha256 = require_sha256(
        lineage.get(MERGED_DIGEST_FIELD),
        field=MERGED_DIGEST_FIELD,
        source=lineage_path,
    )
    public_lineage_digest = public_lineage_sha256(lineage)
    browser_lineage = validate_artifact_lineage(
        browser_dir,
        source_lineage=lineage,
        stage="browser",
        required_parent_stages=BROWSER_PARENT_ARTIFACT_STAGES,
    )
    for field, expected_value in public_lineage_fields(lineage).items():
        if browser_lineage.get(field) != expected_value:
            raise ValueError(
                f"{browser_dir / LINEAGE_FILENAME} field {field!r} does not "
                f"match the selected merge lineage {lineage_path}"
            )
    if browser_lineage.get(SOURCE_LINEAGE_DIGEST_FIELD) != public_lineage_digest:
        raise ValueError(
            f"{browser_dir / LINEAGE_FILENAME} does not preserve selected "
            f"public merge lineage {lineage_path}"
        )
    browser_artifact_sha256 = require_sha256(
        browser_lineage.get(ARTIFACT_DIGEST_FIELD),
        field=ARTIFACT_DIGEST_FIELD,
        source=browser_dir / LINEAGE_FILENAME,
    )

    checkpoint_path = Path(adapter_model_id).resolve()
    if not checkpoint_path.is_dir():
        raise ValueError(
            f"adapter checkpoint from {lineage_path} does not exist: "
            f"{checkpoint_path}"
        )
    checkpoint_label = checkpoint_path.name
    if not checkpoint_label:
        raise ValueError(
            f"adapter checkpoint from {lineage_path} has no publishable name"
        )
    if checkpoint_label != adapter_checkpoint:
        raise ValueError(
            f"{lineage_path} field {ADAPTER_CHECKPOINT_FIELD!r} must match "
            f"adapter checkpoint directory {checkpoint_label!r}"
        )
    actual_adapter_digest = directory_sha256(checkpoint_path)
    if actual_adapter_digest != adapter_model_sha256:
        raise ValueError(
            f"{lineage_path} adapter digest does not match {checkpoint_path}: "
            f"expected {adapter_model_sha256}, got {actual_adapter_digest}"
        )
    trainer_state_path = checkpoint_path / TRAINER_STATE_FILENAME
    trainer_state = _load_json_object(
        trainer_state_path,
        label="trainer state",
    )
    latest_train_loss, latest_train_step, best_validation_eval_loss = (
        _training_losses(trainer_state, source=trainer_state_path)
    )
    adapter_config_path = checkpoint_path / ADAPTER_CONFIG_FILENAME
    adapter_config = _load_json_object(
        adapter_config_path,
        label="adapter configuration",
    )
    ensure_adapter_base_lineage(
        adapter_config,
        source=f"{adapter_config_path} adapter",
    )
    lora_rank, lora_alpha, lora_dropout, lora_target_modules = (
        _lora_configuration(adapter_config, source=adapter_config_path)
    )

    return ModelProvenance(
        adapter_checkpoint=adapter_checkpoint,
        adapter_model_sha256=adapter_model_sha256,
        base_model_revision=base_model_revision,
        merged_model_sha256=merged_model_sha256,
        browser_artifact_sha256=browser_artifact_sha256,
        promoted_checkpoint=checkpoint_label,
        latest_train_loss=latest_train_loss,
        latest_train_step=latest_train_step,
        best_validation_eval_loss=best_validation_eval_loss,
        lora_rank=lora_rank,
        lora_alpha=lora_alpha,
        lora_dropout=lora_dropout,
        lora_target_modules=lora_target_modules,
        release_date=parsed_release_date.isoformat(),
    )


def _load_report(path: Path) -> dict[str, Any]:
    return _load_json_object(path, label="evaluation report")


def _validate_report_evaluation_inputs(
    report: dict[str, Any],
    *,
    report_path: Path,
    expected_split: str,
    expected_dataset_sha256: str,
    expected_prompt_sha256: str,
) -> dict[str, Any]:
    unexpected_report_fields = sorted(set(report) - EVALUATION_REPORT_FIELDS)
    if unexpected_report_fields:
        raise ValueError(
            f"evaluation report {report_path} contains non-publishable fields: "
            f"{', '.join(unexpected_report_fields)}"
        )
    missing_report_fields = sorted(EVALUATION_REPORT_FIELDS - set(report))
    if missing_report_fields:
        raise ValueError(
            f"evaluation report {report_path} is missing required fields: "
            f"{', '.join(missing_report_fields)}"
        )
    report_provenance = report.get("provenance")
    if not isinstance(report_provenance, dict):
        raise ValueError(
            f"evaluation report {report_path} is missing object field 'provenance'; "
            "regenerate it with profile_qa.evaluate"
        )
    report_model_kind = _required_text(
        report_provenance.get("model_kind"),
        field="provenance.model_kind",
        source=report_path,
    )
    try:
        allowed_provenance_fields = evaluation_provenance_fields(report_model_kind)
    except ValueError as exc:
        raise ValueError(f"evaluation report {report_path}: {exc}") from exc
    unexpected_provenance_fields = sorted(
        set(report_provenance) - allowed_provenance_fields
    )
    if unexpected_provenance_fields:
        raise ValueError(
            f"evaluation report {report_path} contains non-publishable "
            "provenance fields: "
            f"{', '.join(unexpected_provenance_fields)}"
        )
    missing_provenance_fields = sorted(
        allowed_provenance_fields - set(report_provenance)
    )
    if missing_provenance_fields:
        raise ValueError(
            f"evaluation report {report_path} is missing required provenance "
            f"fields: {', '.join(missing_provenance_fields)}"
        )
    report_base_model = _required_text(
        report_provenance.get("base_model"),
        field="provenance.base_model",
        source=report_path,
    )
    if report_base_model != PRIMARY_BASE_MODEL_ID:
        raise ValueError(
            f"evaluation report {report_path} must use base model "
            f"{PRIMARY_BASE_MODEL_ID!r}, got {report_base_model!r}"
        )
    report_base_revision = _required_text(
        report_provenance.get(BASE_MODEL_REVISION_FIELD),
        field=f"provenance.{BASE_MODEL_REVISION_FIELD}",
        source=report_path,
    )
    if report_base_revision != PRIMARY_BASE_MODEL_REVISION:
        raise ValueError(
            f"evaluation report {report_path} base revision must be "
            f"{PRIMARY_BASE_MODEL_REVISION!r}, got {report_base_revision!r}"
        )
    if report_model_kind == "baseline":
        report_model_id = _required_text(
            report_provenance.get("model_id"),
            field="provenance.model_id",
            source=report_path,
        )
        if report_model_id != PRIMARY_BASE_MODEL_ID:
            raise ValueError(
                f"evaluation report {report_path} baseline model_id must be "
                f"{PRIMARY_BASE_MODEL_ID!r}"
            )
    report_dataset_sha256 = require_sha256(
        report_provenance.get(DATASET_DIGEST_FIELD),
        field=f"provenance.{DATASET_DIGEST_FIELD}",
        source=report_path,
    )
    if report_dataset_sha256 != expected_dataset_sha256:
        raise ValueError(
            f"evaluation report {report_path} dataset digest does not match "
            "the selected dataset"
        )
    report_prompt_sha256 = require_sha256(
        report_provenance.get(PROMPT_DIGEST_FIELD),
        field=f"provenance.{PROMPT_DIGEST_FIELD}",
        source=report_path,
    )
    if report_prompt_sha256 != expected_prompt_sha256:
        raise ValueError(
            f"evaluation report {report_path} prompt digest does not match "
            "the selected formatted prompt context"
        )
    report_split = _required_text(
        report_provenance.get("split"),
        field="provenance.split",
        source=report_path,
    )
    if report_split != expected_split:
        raise ValueError(
            f"evaluation report {report_path} must describe split "
            f"{expected_split!r}, got {report_split!r}"
        )
    report_scoring_schema = report_provenance.get(SCORING_SCHEMA_FIELD)
    if (
        isinstance(report_scoring_schema, bool)
        or not isinstance(report_scoring_schema, int)
        or report_scoring_schema != SCORING_SCHEMA_VERSION
    ):
        raise ValueError(
            f"evaluation report {report_path} field "
            f"provenance.{SCORING_SCHEMA_FIELD} must be "
            f"{SCORING_SCHEMA_VERSION}; regenerate it with profile_qa.evaluate"
        )
    report_scoring_digest = require_sha256(
        report_provenance.get(SCORING_DIGEST_FIELD),
        field=f"provenance.{SCORING_DIGEST_FIELD}",
        source=report_path,
    )
    expected_scoring_digest = scoring_implementation_sha256()
    if report_scoring_digest != expected_scoring_digest:
        raise ValueError(
            f"evaluation report {report_path} scoring implementation does not "
            "match the current evaluator; regenerate it with profile_qa.evaluate"
        )
    report_generation_schema = report_provenance.get(GENERATION_SCHEMA_FIELD)
    if (
        isinstance(report_generation_schema, bool)
        or not isinstance(report_generation_schema, int)
        or report_generation_schema != GENERATION_SCHEMA_VERSION
    ):
        raise ValueError(
            f"evaluation report {report_path} field "
            f"provenance.{GENERATION_SCHEMA_FIELD} must be "
            f"{GENERATION_SCHEMA_VERSION}; regenerate it with profile_qa.evaluate"
        )
    report_generation_digest = require_sha256(
        report_provenance.get(GENERATION_DIGEST_FIELD),
        field=f"provenance.{GENERATION_DIGEST_FIELD}",
        source=report_path,
    )
    if report_generation_digest != generation_implementation_sha256():
        raise ValueError(
            f"evaluation report {report_path} generation implementation does "
            "not match the current evaluator; regenerate its predictions"
        )
    report_generation_config = report_provenance.get(GENERATION_CONFIG_FIELD)
    if (
        not isinstance(report_generation_config, dict)
        or report_generation_config != generation_config()
    ):
        raise ValueError(
            f"evaluation report {report_path} generation configuration does "
            "not match the current evaluator; regenerate its predictions"
        )
    return report_provenance


def _validate_report_scores(
    report: dict[str, Any],
    *,
    report_path: Path,
    records: list[dict[str, Any]],
) -> None:
    """Recompute a report from its saved predictions using the current scorer."""

    raw_report_records = report.get("records")
    if not isinstance(raw_report_records, list):
        raise ValueError(
            f"evaluation report {report_path} is missing list field 'records'; "
            "regenerate it with profile_qa.evaluate"
        )
    predictions: dict[str, str] = {}
    for entry in raw_report_records:
        if not isinstance(entry, dict):
            raise ValueError(
                f"evaluation report {report_path} field 'records' must contain "
                "objects"
            )
        record_id = entry.get("id")
        prediction = entry.get("prediction")
        if (
            not isinstance(record_id, str)
            or not record_id.strip()
            or not isinstance(prediction, str)
            or record_id in predictions
        ):
            raise ValueError(
                f"evaluation report {report_path} must contain one string "
                "prediction for every unique record ID"
            )
        predictions[record_id] = prediction

    expected_ids = [str(record.get("id", "")) for record in records]
    if (
        any(not record_id for record_id in expected_ids)
        or len(expected_ids) != len(set(expected_ids))
        or set(predictions) != set(expected_ids)
    ):
        raise ValueError(
            f"evaluation report {report_path} predictions do not match the "
            "selected dataset split"
        )

    recomputed = score_predictions(records, predictions)
    score_fields = (
        "macro",
        "by_task",
        "refusal_accuracy",
        "multi_turn_accuracy",
        "records",
    )
    mismatched_fields = [
        field for field in score_fields if report.get(field) != recomputed[field]
    ]
    if mismatched_fields:
        raise ValueError(
            f"evaluation report {report_path} scores do not match its saved "
            "predictions under the current scoring implementation; mismatched "
            f"fields: {', '.join(mismatched_fields)}"
        )


def _validate_report_provenance(
    report: dict[str, Any],
    *,
    report_path: Path,
    expected_split: str,
    expected_dataset_sha256: str,
    expected_prompt_sha256: str,
    model_provenance: ModelProvenance,
    baseline: bool,
) -> tuple[str, str, str] | None:
    report_provenance = _validate_report_evaluation_inputs(
        report,
        report_path=report_path,
        expected_split=expected_split,
        expected_dataset_sha256=expected_dataset_sha256,
        expected_prompt_sha256=expected_prompt_sha256,
    )
    base_model = _required_text(
        report_provenance.get("base_model"),
        field="provenance.base_model",
        source=report_path,
    )
    if base_model != PRIMARY_BASE_MODEL_ID:
        raise ValueError(
            f"evaluation report {report_path} must use base model "
            f"{PRIMARY_BASE_MODEL_ID!r}, got {base_model!r}"
        )
    report_base_revision = _required_text(
        report_provenance.get(BASE_MODEL_REVISION_FIELD),
        field=f"provenance.{BASE_MODEL_REVISION_FIELD}",
        source=report_path,
    )
    if report_base_revision != model_provenance.base_model_revision:
        raise ValueError(
            f"evaluation report {report_path} base revision does not match the "
            "selected merge lineage"
        )

    model_kind = _required_text(
        report_provenance.get("model_kind"),
        field="provenance.model_kind",
        source=report_path,
    )
    if baseline:
        if model_kind != "baseline":
            raise ValueError(
                f"evaluation report {report_path} must describe the baseline model"
            )
        if report_provenance.get("model_id") != PRIMARY_BASE_MODEL_ID:
            raise ValueError(
                f"evaluation report {report_path} baseline model_id must be "
                f"{PRIMARY_BASE_MODEL_ID!r}"
            )
        return None

    promoted_identity = _promoted_report_identity(
        report,
        report_path=report_path,
    )
    model_kind, _, report_model_digest = promoted_identity
    report_adapter_checkpoint = require_checkpoint_label(
        report_provenance.get(ADAPTER_CHECKPOINT_FIELD),
        source=report_path,
    )
    if report_adapter_checkpoint != model_provenance.adapter_checkpoint:
        raise ValueError(
            f"evaluation report {report_path} does not match selected checkpoint "
            f"{model_provenance.adapter_checkpoint}"
        )
    report_adapter_digest = require_sha256(
        report_provenance.get(ADAPTER_DIGEST_FIELD),
        field=f"provenance.{ADAPTER_DIGEST_FIELD}",
        source=report_path,
    )
    if report_adapter_digest != model_provenance.adapter_model_sha256:
        raise ValueError(
            f"evaluation report {report_path} adapter digest does not match the "
            "selected merge lineage"
        )
    expected_model_digest = (
        model_provenance.adapter_model_sha256
        if model_kind == "adapter"
        else model_provenance.merged_model_sha256
    )
    if report_model_digest != expected_model_digest:
        raise ValueError(
            f"evaluation report {report_path} evaluated model digest does not "
            "match the selected merge lineage"
        )
    return promoted_identity


def _promoted_report_identity(
    report: dict[str, Any],
    *,
    report_path: Path,
) -> tuple[str, str, str]:
    """Return one strict promoted-model representation from report provenance."""

    provenance = report.get("provenance")
    if not isinstance(provenance, dict):
        raise ValueError(
            f"evaluation report {report_path} is missing object field 'provenance'"
        )
    model_kind = _required_text(
        provenance.get("model_kind"),
        field="provenance.model_kind",
        source=report_path,
    )
    if model_kind not in {"adapter", "merged"}:
        raise ValueError(
            f"evaluation report {report_path} must describe an adapter or merged model"
        )
    model_id = _required_text(
        provenance.get("model_id"),
        field="provenance.model_id",
        source=report_path,
    )
    model_sha256 = require_sha256(
        provenance.get("model_sha256"),
        field="provenance.model_sha256",
        source=report_path,
    )
    adapter_checkpoint = require_checkpoint_label(
        provenance.get(ADAPTER_CHECKPOINT_FIELD),
        source=report_path,
    )
    adapter_sha256 = require_sha256(
        provenance.get(ADAPTER_DIGEST_FIELD),
        field=f"provenance.{ADAPTER_DIGEST_FIELD}",
        source=report_path,
    )
    expected_model_id = (
        adapter_checkpoint if model_kind == "adapter" else "merged-model"
    )
    if model_id != expected_model_id:
        raise ValueError(
            f"evaluation report {report_path} model_id must be "
            f"{expected_model_id!r} for model kind {model_kind!r}"
        )
    if model_kind == "adapter" and model_sha256 != adapter_sha256:
        raise ValueError(
            f"evaluation report {report_path} adapter model_sha256 must match "
            f"provenance.{ADAPTER_DIGEST_FIELD}"
        )
    return model_kind, model_id, model_sha256


def _require_baseline_report_identity(
    report: dict[str, Any],
    *,
    report_path: Path,
) -> None:
    """Require the canonical pinned base model in the baseline report slot."""

    provenance = report.get("provenance")
    if not isinstance(provenance, dict):
        raise ValueError(
            f"evaluation report {report_path} is missing object field 'provenance'"
        )
    model_kind = _required_text(
        provenance.get("model_kind"),
        field="provenance.model_kind",
        source=report_path,
    )
    if model_kind != "baseline":
        raise ValueError(
            f"evaluation report {report_path} must describe the baseline model"
        )


def _require_matching_promoted_report_identity(
    validation_identity: tuple[str, str, str],
    *,
    validation_path: Path,
    test_identity: tuple[str, str, str],
    test_path: Path,
) -> None:
    if validation_identity != test_identity:
        raise ValueError(
            "promoted validation and test reports must use the same model "
            "representation (model_kind, model_id, and model_sha256); got "
            f"{validation_identity!r} from {validation_path} and "
            f"{test_identity!r} from {test_path}"
        )


def _load_evaluation_reports(
    args: argparse.Namespace,
    model_provenance: ModelProvenance,
) -> EvaluationReports:
    dataset_records = read_jsonl(Path(args.dataset))
    dataset_sha256 = canonical_jsonl_sha256(dataset_records)
    prompt_sha256_by_split = {
        split: evaluation_prompt_sha256(_split_records(dataset_records, split))
        for split in ("validation", "test")
    }
    baseline_path = Path(args.baseline_report)
    validation_path = Path(args.validation_report)
    test_path = Path(args.test_report)
    baseline_test = _load_report(baseline_path)
    promoted_validation = _load_report(validation_path)
    promoted_test = _load_report(test_path)
    _validate_report_provenance(
        baseline_test,
        report_path=baseline_path,
        expected_split="test",
        expected_dataset_sha256=dataset_sha256,
        expected_prompt_sha256=prompt_sha256_by_split["test"],
        model_provenance=model_provenance,
        baseline=True,
    )
    _validate_report_scores(
        baseline_test,
        report_path=baseline_path,
        records=_split_records(dataset_records, "test"),
    )
    validation_identity = _validate_report_provenance(
        promoted_validation,
        report_path=validation_path,
        expected_split="validation",
        expected_dataset_sha256=dataset_sha256,
        expected_prompt_sha256=prompt_sha256_by_split["validation"],
        model_provenance=model_provenance,
        baseline=False,
    )
    _validate_report_scores(
        promoted_validation,
        report_path=validation_path,
        records=_split_records(dataset_records, "validation"),
    )
    test_identity = _validate_report_provenance(
        promoted_test,
        report_path=test_path,
        expected_split="test",
        expected_dataset_sha256=dataset_sha256,
        expected_prompt_sha256=prompt_sha256_by_split["test"],
        model_provenance=model_provenance,
        baseline=False,
    )
    _validate_report_scores(
        promoted_test,
        report_path=test_path,
        records=_split_records(dataset_records, "test"),
    )
    if validation_identity is None or test_identity is None:
        raise AssertionError("promoted report validation did not return an identity")
    _require_matching_promoted_report_identity(
        validation_identity,
        validation_path=validation_path,
        test_identity=test_identity,
        test_path=test_path,
    )
    return EvaluationReports(
        baseline_test=baseline_test,
        promoted_validation=promoted_validation,
        promoted_test=promoted_test,
    )


def _metric(value: float) -> str:
    return f"{value:.4f}"


def _plain_number(value: float) -> str:
    return f"{value:g}"


def _copy_tree_contents(source_dir: Path, target_dir: Path) -> None:
    if target_dir.exists():
        shutil.rmtree(target_dir)
    target_dir.mkdir(parents=True, exist_ok=True)
    for source_path in sorted(source_dir.iterdir()):
        target_path = target_dir / source_path.name
        if source_path.is_dir():
            shutil.copytree(source_path, target_path, dirs_exist_ok=True)
        elif source_path.is_file():
            shutil.copy2(source_path, target_path)


def _write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, sort_keys=True), encoding="utf-8")


def _split_records(records: list[dict[str, Any]], split: str) -> list[dict[str, Any]]:
    return [record for record in records if record.get("split") == split]


def _counter_table(counter: Counter[str], header: str) -> str:
    lines = [f"| {header} | Count |", "| --- | ---: |"]
    for key, count in sorted(counter.items()):
        lines.append(f"| `{key}` | {count} |")
    return "\n".join(lines)


def _evaluation_table(
    baseline_test: dict[str, Any],
    promoted_validation: dict[str, Any],
    promoted_test: dict[str, Any],
) -> str:
    return "\n".join(
        [
            "| Run | Macro | Refusal Accuracy | Multi-Turn Accuracy |",
            "| --- | ---: | ---: | ---: |",
            (
                "| Teapot baseline, test | "
                f"{_metric(float(baseline_test['macro']))} | "
                f"{_metric(float(baseline_test['refusal_accuracy']))} | "
                f"{_metric(float(baseline_test['multi_turn_accuracy']))} |"
            ),
            (
                "| Promoted checkpoint, validation | "
                f"{_metric(float(promoted_validation['macro']))} | "
                f"{_metric(float(promoted_validation['refusal_accuracy']))} | "
                f"{_metric(float(promoted_validation['multi_turn_accuracy']))} |"
            ),
            (
                "| Promoted checkpoint, test | "
                f"{_metric(float(promoted_test['macro']))} | "
                f"{_metric(float(promoted_test['refusal_accuracy']))} | "
                f"{_metric(float(promoted_test['multi_turn_accuracy']))} |"
            ),
        ]
    )


def _task_table(report: dict[str, Any]) -> str:
    lines = ["| Task | Macro |", "| --- | ---: |"]
    for task, score in sorted(report["by_task"].items()):
        lines.append(f"| `{task}` | {_metric(float(score))} |")
    return "\n".join(lines)


def _write_model_card(
    output_path: Path,
    *,
    model_repo_id: str,
    dataset_repo_id: str,
    baseline_test: dict[str, Any],
    promoted_validation: dict[str, Any],
    promoted_test: dict[str, Any],
    provenance: ModelProvenance,
) -> None:
    promoted_checkpoint = provenance.promoted_checkpoint
    base_model_revision = provenance.base_model_revision
    latest_train_loss = _metric(provenance.latest_train_loss)
    latest_train_step = provenance.latest_train_step
    best_validation_eval_loss = _metric(provenance.best_validation_eval_loss)
    release_date = provenance.release_date
    browser_artifact_sha256 = provenance.browser_artifact_sha256
    lora_target_modules = ", ".join(
        f"`{module}`" for module in provenance.lora_target_modules
    )
    output_path.write_text(
        f"""---
license: mit
library_name: transformers.js
base_model: teapotai/teapotllm
pipeline_tag: text-generation
tags:
- transformers.js
- onnx
- int8
- uint8
- lora
- profile-qa
datasets:
- {dataset_repo_id}
metrics:
- accuracy
---

# Teapot Profile-QA Browser 1024

## Description

This model is a browser-oriented ONNX export of a PEFT LoRA adapter merged into
`teapotai/teapotllm`. It is tuned for public resume/profile Q&A prompts that fit
within a 1024-token browser context budget.

Hugging Face model metadata uses the official `text-generation` task category;
the browser runtime still loads this T5-style export with the Transformers.js
`text2text-generation` pipeline.

The target use case is a static portfolio or resume site that runs inference in
the browser with Transformers.js, without API routes, hosted inference, server
actions, or runtime model services. The profile schema is intentionally generic
for repo reuse: `identity`, `current_role`, `experience`, `projects`, `education`,
`recommendations`, `skills`, and `interests`.

## Browser Artifacts

The repository payload contains tokenizer/config files at the root and
Transformers.js ONNX files under `onnx/`:

- `encoder_model_int8.onnx`
- `decoder_model_merged_int8.onnx`
- `encoder_model_uint8.onnx`
- `decoder_model_merged_uint8.onnx`
- `{LINEAGE_FILENAME}`

The export gate rejects external `.onnx.data` files so the model can be loaded
as self-contained browser assets. The lineage marker records the sanitized
public merge lineage and its path-independent digest; the exact full-precision,
int8, and uint8 parent-stage digests; and an artifact SHA-256 of
`{browser_artifact_sha256}` over the browser model/config payload, excluding the
lineage marker and generated model card.

## How to Use

```javascript
import {{ pipeline }} from "@huggingface/transformers";

const generator = await pipeline(
  "text2text-generation",
  "{model_repo_id}",
  {{ dtype: "int8" }},
);

const result = await generator(prompt, {{ max_new_tokens: 160 }});
```

Use `dtype: "uint8"` as a browser fallback if the target environment has issues
with signed int8 ONNX weights.

## Training

- Base model: `teapotai/teapotllm`
- Base model revision: `{base_model_revision}`
- Method represented by the selected adapter: PEFT LoRA
- Promoted checkpoint: `{promoted_checkpoint}`
- LoRA: rank {provenance.lora_rank}, alpha {_plain_number(provenance.lora_alpha)},
  dropout {_plain_number(provenance.lora_dropout)}, target modules
  {lora_target_modules}
- Latest recorded train loss: {latest_train_loss} at step {latest_train_step}
- Best recorded validation eval loss: {best_validation_eval_loss}

## Software

- Training: PyTorch, Transformers, PEFT, bitsandbytes, Datasets
- Export: Optimum ONNX export, ONNX Runtime dynamic quantization
- Browser runtime: Transformers.js with ONNX Runtime Web/WASM
- Browser packaging: `text2text-generation-with-past` export with
  `decoder_model_merged` and subgraph-enabled ONNX quantization

## Hardware

The selected checkpoint does not preserve trustworthy hardware, optimizer,
quantization, or effective-batch-size provenance. Those run-specific claims are
therefore omitted from this generated card. Export and card preparation can run
on CPU after training completes.

## Evaluation

{_evaluation_table(baseline_test, promoted_validation, promoted_test)}

Promoted checkpoint test macro by task:

{_task_table(promoted_test)}

## Intended Uses

- Browser-only profile or resume Q&A.
- Static portfolio demos where answers must stay grounded in public profile
  context.
- Forks that replace the included public facts with another person's public
  resume/profile sections.

## Limitations

This is not a general assistant. The dataset is synthetic and profile-specific,
so production use should regenerate data from the target person's public facts
and rerun local evaluation. The model should refuse private or unsupported facts
when the public profile context does not answer.

## Responsible AI Considerations

Keep factual context public, review generated examples for private-data leakage,
and preserve refusal examples for sensitive or absent facts such as home
addresses, phone numbers, salary, and classified information. Do not use this
model for background checks, hiring decisions, legal advice, medical advice, or
identity verification.

## Release Notes

- {release_date}: Browser profile-QA export from `{promoted_checkpoint}` with
  `int8` and `uint8` ONNX variants.

## License

MIT. The base model card for `teapotai/teapotllm` also lists MIT.
""",
        encoding="utf-8",
    )


def _write_dataset_card(
    output_path: Path,
    *,
    records: list[dict[str, Any]],
    model_repo_id: str,
    baseline_test: dict[str, Any],
    promoted_validation: dict[str, Any],
    promoted_test: dict[str, Any],
) -> None:
    split_counter = Counter(str(record["split"]) for record in records)
    task_counter = Counter(str(record["task"]) for record in records)
    output_path.write_text(
        f"""---
license: mit
task_categories:
- text-generation
language:
- en
pretty_name: Profile-QA Synthetic Public V1
tags:
- synthetic
- profile-qa
- resume
- public-profile
size_categories:
- n<1K
---

# Profile-QA Synthetic Public V1

## Description

This dataset contains deterministic synthetic Q&A examples for public
resume/profile answering. It was generated from generic resume sections and
public-style facts, with evidence references back to `section_id` and `fact_id`.

The ontology is intentionally reusable across people and forks:
`identity`, `current_role`, `experience`, `projects`, `education`,
`recommendations`, `skills`, and `interests`. Temporal and practical sections
are prioritized first; experience outranks education, and recommendations sit
below education but above hobbies/interests or personality-trait sections.

## Files

- `profile_qa.jsonl`: full dataset.
- `profile_qa_train.jsonl`: train split.
- `profile_qa_validation.jsonl`: validation split.
- `profile_qa_test.jsonl`: test split.
- `profile_sections.json`: source public profile sections and facts.
- `eval_reports/*.json`: baseline and promoted model evaluation reports.

## Schema

Each JSONL record contains:

- `id`: stable example id.
- `split`: `train`, `validation`, or `test`.
- `task`: task family such as `single_turn`, `multi_turn`, `multi_hop`,
  `chronology`, `education`, `recommendations`, or `refusal`.
- `question`: user question.
- `answer`: target grounded answer.
- `evidence`: list of `section_id` and `fact_id` references.
- `expected_terms`: scoring terms for deterministic evaluation.
- `requires_refusal`: true when the answer must say the public profile does not
  provide the requested fact.
- `history`: recent conversation turns for follow-up examples.
- `source_profile_version`: generator/profile version.

## Splits

{_counter_table(split_counter, "Split")}

## Task Coverage

{_counter_table(task_counter, "Task")}

## Evaluation

The paired model for this dataset is `{model_repo_id}`.

{_evaluation_table(baseline_test, promoted_validation, promoted_test)}

Promoted checkpoint test macro by task:

{_task_table(promoted_test)}

## Intended Uses

- Local LoRA/QLoRA continuation training for browser profile Q&A.
- Regression tests for section retrieval, evidence grounding, follow-up turns,
  unsupported fact refusal, and 1024-token prompt budgeting.
- A template for replacing facts with another person's public resume/profile
  data while keeping reusable generic sections.

## Limitations

The examples are synthetic and derived from a small public-profile fact set.
They are useful for focused profile-QA behavior, not for broad instruction
tuning. Regenerate and audit the dataset before using it for another person.

## Safety

The generator and tests reject private-data leakage in non-refusal examples and
include refusal coverage for absent or sensitive facts. Keep generated datasets,
checkpoints, merged models, and ONNX artifacts out of git-tracked source.

## License

MIT.
""",
        encoding="utf-8",
    )


def prepare_model_payload(args: argparse.Namespace) -> Path:
    lineage_file = getattr(args, "lineage_file", None)
    if not isinstance(lineage_file, str) or not lineage_file.strip():
        raise ValueError("model lineage is required; pass --lineage-file")
    browser_dir = Path(args.model_browser_dir)
    if not browser_dir.exists():
        raise RuntimeError(f"model browser directory does not exist: {browser_dir}")
    reject_external_data_files(browser_dir)
    provenance = load_model_provenance(
        Path(lineage_file),
        browser_dir,
        getattr(args, "release_date", None),
    )
    missing_browser_artifacts = [
        filename
        for filename in BROWSER_ONNX_FILENAMES
        if not (browser_dir / "onnx" / filename).is_file()
    ]
    if missing_browser_artifacts:
        raise ValueError(
            f"model browser directory {browser_dir} is missing published ONNX "
            f"artifacts: {', '.join(missing_browser_artifacts)}"
        )
    reports = _load_evaluation_reports(args, provenance)

    model_output_dir = Path(args.output_dir) / "model"
    _copy_tree_contents(browser_dir, model_output_dir)

    _write_model_card(
        model_output_dir / "README.md",
        model_repo_id=args.model_repo_id,
        dataset_repo_id=args.dataset_repo_id,
        baseline_test=reports.baseline_test,
        promoted_validation=reports.promoted_validation,
        promoted_test=reports.promoted_test,
        provenance=provenance,
    )
    reject_external_data_files(model_output_dir)
    return model_output_dir


def prepare_dataset_payload(args: argparse.Namespace) -> Path:
    records = read_jsonl(Path(args.dataset))
    dataset_sha256 = canonical_jsonl_sha256(records)
    report_inputs = [
        (Path(args.baseline_report), "test"),
        (Path(args.validation_report), "validation"),
        (Path(args.test_report), "test"),
    ]
    loaded_reports: list[dict[str, Any]] = []
    for report_path, split in report_inputs:
        report = _load_report(report_path)
        split_records = _split_records(records, split)
        _validate_report_evaluation_inputs(
            report,
            report_path=report_path,
            expected_split=split,
            expected_dataset_sha256=dataset_sha256,
            expected_prompt_sha256=evaluation_prompt_sha256(split_records),
        )
        _validate_report_scores(
            report,
            report_path=report_path,
            records=split_records,
        )
        loaded_reports.append(report)

    _require_baseline_report_identity(
        loaded_reports[0],
        report_path=report_inputs[0][0],
    )
    validation_identity = _promoted_report_identity(
        loaded_reports[1],
        report_path=report_inputs[1][0],
    )
    test_identity = _promoted_report_identity(
        loaded_reports[2],
        report_path=report_inputs[2][0],
    )
    _require_matching_promoted_report_identity(
        validation_identity,
        validation_path=report_inputs[1][0],
        test_identity=test_identity,
        test_path=report_inputs[2][0],
    )

    dataset_output_dir = Path(args.output_dir) / "dataset"
    if dataset_output_dir.exists():
        shutil.rmtree(dataset_output_dir)
    dataset_output_dir.mkdir(parents=True, exist_ok=True)

    write_jsonl(dataset_output_dir / "profile_qa.jsonl", records)
    for split in ["train", "validation", "test"]:
        write_jsonl(dataset_output_dir / f"profile_qa_{split}.jsonl", _split_records(records, split))
    _write_json(dataset_output_dir / "profile_sections.json", PROFILE_SECTIONS)

    reports_dir = dataset_output_dir / "eval_reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    for (report_path, _), report in zip(
        report_inputs,
        loaded_reports,
        strict=True,
    ):
        _write_json(reports_dir / report_path.name, report)

    baseline_test, promoted_validation, promoted_test = loaded_reports
    _write_dataset_card(
        dataset_output_dir / "README.md",
        records=records,
        model_repo_id=args.model_repo_id,
        baseline_test=baseline_test,
        promoted_validation=promoted_validation,
        promoted_test=promoted_test,
    )
    return dataset_output_dir


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--model-browser-dir",
        default=str(ONNX_DIR / "candidate" / "browser"),
    )
    parser.add_argument("--dataset", default=str(DEFAULT_DATASET_PATH))
    parser.add_argument("--output-dir", default=str(PACKAGE_ROOT / "hf"))
    parser.add_argument("--model-repo-id", default=DEFAULT_MODEL_REPO_ID)
    parser.add_argument("--dataset-repo-id", default=DEFAULT_DATASET_REPO_ID)
    parser.add_argument(
        "--lineage-file",
        required=True,
        help="lineage JSON produced by profile_qa.merge_adapter",
    )
    parser.add_argument(
        "--release-date",
        required=True,
        help="model-card release date in YYYY-MM-DD format",
    )
    parser.add_argument(
        "--baseline-report",
        default=str(REPORT_DIR / "profile_qa_eval_baseline_test.json"),
    )
    parser.add_argument(
        "--validation-report",
        default=str(REPORT_DIR / "profile_qa_eval_candidate_validation.json"),
    )
    parser.add_argument(
        "--test-report",
        default=str(REPORT_DIR / "profile_qa_eval_candidate_test.json"),
    )
    args = parser.parse_args()

    model_dir = prepare_model_payload(args)
    dataset_dir = prepare_dataset_payload(args)
    print(f"prepared model payload: {model_dir}")
    print(f"prepared dataset payload: {dataset_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
