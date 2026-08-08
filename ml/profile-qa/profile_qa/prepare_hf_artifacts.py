"""Prepare Hugging Face model and dataset repository payloads."""

from __future__ import annotations

import argparse
import json
import math
import re
import shutil
from collections import Counter
from collections.abc import Mapping
from pathlib import Path
from typing import Any

from .config import (
    DEFAULT_DATASET_PATH,
    ONNX_DIR,
    PACKAGE_ROOT,
    PRIMARY_BASE_MODEL_ID,
    PRIMARY_BASE_MODEL_REVISION,
)
from .evaluate import score_predictions
from .export_onnx import reject_external_data_files
from .provenance import (
    PROVENANCE_SCHEMA_VERSION,
    candidate_payload_sha256,
    load_candidate_provenance,
    refresh_candidate_provenance,
    sha256_file,
)
from .public_profile import PROFILE_SECTIONS
from .validation import read_jsonl, write_jsonl

DEFAULT_MODEL_REPO_ID = "justinthelaw/teapot-profile-qa-browser-1024"
DEFAULT_DATASET_REPO_ID = "justinthelaw/profile-qa-synthetic-public-v1"
MIN_BASELINE_RELATIVE_MACRO_IMPROVEMENT = 0.15
MIN_REFUSAL_ACCURACY = 0.95
MIN_MULTI_TURN_ACCURACY = 0.80
_REQUIRED_REPORT_METRICS = (
    "macro",
    "refusal_accuracy",
    "multi_turn_accuracy",
)
_COMPARISON_TOLERANCE = 1e-12
_SHA256_PATTERN = re.compile(r"[0-9a-f]{64}")


def _load_report(path: Path) -> dict[str, Any]:
    try:
        report = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"could not load evaluation report {path}: {exc}") from exc
    if not isinstance(report, dict):
        raise ValueError(f"evaluation report {path} must contain a JSON object")
    return report


def _read_score(
    report: Mapping[str, Any],
    *,
    report_name: str,
    metric_name: str,
    errors: list[str],
) -> float | None:
    if metric_name not in report:
        errors.append(f"{report_name} report is missing metric {metric_name!r}")
        return None

    value = report[metric_name]
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        errors.append(
            f"{report_name} metric {metric_name!r} must be a number, got {value!r}"
        )
        return None

    score = float(value)
    if not math.isfinite(score):
        errors.append(
            f"{report_name} metric {metric_name!r} must be finite, got {value!r}"
        )
        return None
    if not 0.0 <= score <= 1.0:
        errors.append(
            f"{report_name} metric {metric_name!r} must be between 0 and 1, "
            f"got {score:.4f}"
        )
        return None
    return score


def validate_promotion_metrics(
    *,
    baseline_test: object,
    promoted_validation: object,
    promoted_test: object,
) -> None:
    """Reject malformed or below-threshold evaluation reports before packaging."""

    reports = {
        "baseline test": baseline_test,
        "promoted validation": promoted_validation,
        "promoted test": promoted_test,
    }
    errors: list[str] = []
    scores: dict[tuple[str, str], float] = {}

    for report_name, report in reports.items():
        if not isinstance(report, Mapping):
            errors.append(f"{report_name} report must be a JSON object")
            continue
        for metric_name in _REQUIRED_REPORT_METRICS:
            score = _read_score(
                report,
                report_name=report_name,
                metric_name=metric_name,
                errors=errors,
            )
            if score is not None:
                scores[(report_name, metric_name)] = score

    task_metric_pairs = (
        ("refusal", "refusal_accuracy"),
        ("multi_turn", "multi_turn_accuracy"),
    )
    for report_name, report in (
        ("promoted validation", promoted_validation),
        ("promoted test", promoted_test),
    ):
        if not isinstance(report, Mapping):
            continue
        by_task = report.get("by_task")
        if not isinstance(by_task, Mapping) or not by_task:
            errors.append(
                f"{report_name} report field 'by_task' must be a non-empty object"
            )
            continue

        task_scores: dict[str, float] = {}
        for task, value in by_task.items():
            if not isinstance(task, str) or not task.strip():
                errors.append(f"{report_name} report contains an invalid by_task name")
                continue
            score = _read_score(
                {f"by_task.{task}": value},
                report_name=report_name,
                metric_name=f"by_task.{task}",
                errors=errors,
            )
            if score is not None:
                task_scores[task] = score

        for task_name, metric_name in task_metric_pairs:
            if task_name not in by_task:
                errors.append(
                    f"{report_name} report is missing required by_task entry "
                    f"{task_name!r}"
                )
                continue
            task_score = task_scores.get(task_name)
            top_level_score = scores.get((report_name, metric_name))
            if (
                task_score is not None
                and top_level_score is not None
                and abs(task_score - top_level_score) > _COMPARISON_TOLERANCE
            ):
                errors.append(
                    f"{report_name} by_task {task_name!r} must agree with "
                    f"{metric_name!r}: by_task={task_score:.4f}, "
                    f"top-level={top_level_score:.4f}"
                )

    baseline_macro = scores.get(("baseline test", "macro"))
    promoted_test_macro = scores.get(("promoted test", "macro"))
    if baseline_macro is not None and promoted_test_macro is not None:
        if baseline_macro <= 0.0:
            errors.append(
                "baseline test macro must be greater than 0 for a relative "
                f"improvement comparison, got {baseline_macro:.4f}"
            )
        else:
            required_macro = baseline_macro * (
                1.0 + MIN_BASELINE_RELATIVE_MACRO_IMPROVEMENT
            )
            if promoted_test_macro + _COMPARISON_TOLERANCE < required_macro:
                relative_improvement = promoted_test_macro / baseline_macro - 1.0
                errors.append(
                    "promoted test macro must improve on baseline test by at least "
                    f"{MIN_BASELINE_RELATIVE_MACRO_IMPROVEMENT:.0%}: "
                    f"baseline={baseline_macro:.4f}, "
                    f"promoted={promoted_test_macro:.4f}, "
                    f"relative improvement={relative_improvement:.2%}, "
                    f"required promoted macro>={required_macro:.4f}"
                )

    accuracy_gates = (
        ("refusal_accuracy", MIN_REFUSAL_ACCURACY),
        ("multi_turn_accuracy", MIN_MULTI_TURN_ACCURACY),
    )
    for report_name in ("promoted validation", "promoted test"):
        for metric_name, minimum in accuracy_gates:
            score = scores.get((report_name, metric_name))
            if score is not None and score + _COMPARISON_TOLERANCE < minimum:
                errors.append(
                    f"{report_name} metric {metric_name!r} must be at least "
                    f"{minimum:.4f}, got {score:.4f}"
                )

    if errors:
        details = "\n".join(f"- {error}" for error in errors)
        raise ValueError(f"promotion metric validation failed:\n{details}")


def validate_report_aggregates(
    *,
    baseline_test: object,
    promoted_validation: object,
    promoted_test: object,
    dataset_records: list[dict[str, Any]],
) -> None:
    """Recompute report scores from predictions and the fingerprinted dataset."""

    errors: list[str] = []
    report_expectations = (
        ("baseline test", baseline_test, "test"),
        ("promoted validation", promoted_validation, "validation"),
        ("promoted test", promoted_test, "test"),
    )
    for report_name, report, split in report_expectations:
        if not isinstance(report, Mapping):
            continue

        split_records = [
            record for record in dataset_records if record.get("split") == split
        ]
        expected_ids: list[str] = []
        for index, record in enumerate(split_records):
            record_id = record.get("id")
            if not isinstance(record_id, str) or not record_id:
                errors.append(
                    f"dataset {split} record at index {index} must have a non-empty "
                    "string id"
                )
                continue
            expected_ids.append(record_id)
        if len(expected_ids) != len(set(expected_ids)):
            errors.append(f"dataset {split} records contain duplicate ids")

        raw_report_records = report.get("records")
        if not isinstance(raw_report_records, list) or not raw_report_records:
            errors.append(
                f"{report_name} report field 'records' must be a non-empty array"
            )
            continue

        report_records: dict[str, Mapping[str, Any]] = {}
        predictions: dict[str, str] = {}
        for index, raw_record in enumerate(raw_report_records):
            if not isinstance(raw_record, Mapping):
                errors.append(
                    f"{report_name} report record at index {index} must be an object"
                )
                continue
            record_id = raw_record.get("id")
            prediction = raw_record.get("prediction")
            if not isinstance(record_id, str) or not record_id:
                errors.append(
                    f"{report_name} report record at index {index} must have a "
                    "non-empty string id"
                )
                continue
            if record_id in report_records:
                errors.append(
                    f"{report_name} report contains duplicate id {record_id!r}"
                )
                continue
            if not isinstance(prediction, str):
                errors.append(
                    f"{report_name} report record {record_id!r} prediction must be "
                    "a string"
                )
                continue
            report_records[record_id] = raw_record
            predictions[record_id] = prediction

        expected_id_set = set(expected_ids)
        report_id_set = set(report_records)
        missing_ids = sorted(expected_id_set - report_id_set)
        extra_ids = sorted(report_id_set - expected_id_set)
        if missing_ids:
            errors.append(f"{report_name} report is missing record ids: {missing_ids}")
        if extra_ids:
            errors.append(
                f"{report_name} report has unexpected record ids: {extra_ids}"
            )
        if missing_ids or extra_ids or len(expected_ids) != len(expected_id_set):
            continue

        recomputed = score_predictions(split_records, predictions)
        for metric_name in _REQUIRED_REPORT_METRICS:
            reported_score = _read_score(
                report,
                report_name=report_name,
                metric_name=metric_name,
                errors=errors,
            )
            expected_score = float(recomputed[metric_name])
            if (
                reported_score is not None
                and abs(reported_score - expected_score) > _COMPARISON_TOLERANCE
            ):
                errors.append(
                    f"{report_name} metric {metric_name!r} does not match its "
                    f"records: reported={reported_score:.4f}, "
                    f"recomputed={expected_score:.4f}"
                )

        reported_by_task = report.get("by_task")
        expected_by_task = recomputed["by_task"]
        if not isinstance(reported_by_task, Mapping):
            errors.append(f"{report_name} report field 'by_task' must be an object")
        else:
            reported_tasks = {
                task for task in reported_by_task if isinstance(task, str)
            }
            expected_tasks = set(expected_by_task)
            if reported_tasks != expected_tasks:
                errors.append(
                    f"{report_name} by_task keys do not match its records: "
                    f"reported={sorted(reported_tasks)}, "
                    f"recomputed={sorted(expected_tasks)}"
                )
            for task_name, expected_score in expected_by_task.items():
                reported_score = _read_score(
                    reported_by_task,
                    report_name=report_name,
                    metric_name=task_name,
                    errors=errors,
                )
                if (
                    reported_score is not None
                    and abs(reported_score - expected_score) > _COMPARISON_TOLERANCE
                ):
                    errors.append(
                        f"{report_name} by_task {task_name!r} does not match its "
                        f"records: reported={reported_score:.4f}, "
                        f"recomputed={expected_score:.4f}"
                    )

        recomputed_records = {
            str(record["id"]): record for record in recomputed["records"]
        }
        for record_id, raw_record in report_records.items():
            expected_record = recomputed_records[record_id]
            if raw_record.get("task") != expected_record["task"]:
                errors.append(
                    f"{report_name} record {record_id!r} task does not match the "
                    "dataset"
                )
            for metric_name in ("macro", "term", "refusal"):
                reported_score = _read_score(
                    raw_record,
                    report_name=f"{report_name} record {record_id!r}",
                    metric_name=metric_name,
                    errors=errors,
                )
                expected_score = float(expected_record[metric_name])
                if (
                    reported_score is not None
                    and abs(reported_score - expected_score) > _COMPARISON_TOLERANCE
                ):
                    errors.append(
                        f"{report_name} record {record_id!r} metric "
                        f"{metric_name!r} does not match its prediction: "
                        f"reported={reported_score:.4f}, "
                        f"recomputed={expected_score:.4f}"
                    )

    if errors:
        details = "\n".join(f"- {error}" for error in errors)
        raise ValueError(f"evaluation report aggregate validation failed:\n{details}")


def _valid_sha256(value: object) -> bool:
    return isinstance(value, str) and _SHA256_PATTERN.fullmatch(value) is not None


def _valid_schema_version(value: object) -> bool:
    return type(value) is int and value == PROVENANCE_SCHEMA_VERSION


def validate_promotion_provenance(
    *,
    baseline_test: object,
    promoted_validation: object,
    promoted_test: object,
    dataset_path: Path,
    model_browser_dir: Path,
) -> None:
    """Bind reports to the exact dataset, split, source model, and browser export."""

    errors: list[str] = []
    try:
        dataset_sha256 = sha256_file(dataset_path)
    except ValueError as exc:
        errors.append(str(exc))
        dataset_sha256 = None

    try:
        manifest = load_candidate_provenance(model_browser_dir)
    except ValueError as exc:
        errors.append(str(exc))
        manifest = {}

    if not _valid_schema_version(manifest.get("schema_version")):
        errors.append(
            f"candidate provenance schema_version must be {PROVENANCE_SCHEMA_VERSION}"
        )

    source_model = manifest.get("source_model")
    candidate_model_sha256: str | None = None
    if not isinstance(source_model, Mapping):
        errors.append("candidate provenance field 'source_model' must be an object")
    else:
        candidate_sha = source_model.get("sha256")
        if not _valid_sha256(candidate_sha):
            errors.append(
                "candidate provenance source_model.sha256 must be a lowercase "
                "SHA-256 digest"
            )
        else:
            candidate_model_sha256 = candidate_sha

    recorded_browser_sha = manifest.get("browser_sha256")
    if not _valid_sha256(recorded_browser_sha):
        errors.append(
            "candidate provenance browser_sha256 must be a lowercase SHA-256 digest"
        )
    else:
        try:
            actual_browser_sha = candidate_payload_sha256(model_browser_dir)
        except ValueError as exc:
            errors.append(str(exc))
        else:
            if actual_browser_sha != recorded_browser_sha:
                errors.append(
                    "candidate browser artifact does not match its provenance: "
                    f"recorded={recorded_browser_sha}, actual={actual_browser_sha}"
                )

    report_expectations = (
        ("baseline test", baseline_test, "test", False),
        ("promoted validation", promoted_validation, "validation", True),
        ("promoted test", promoted_test, "test", True),
    )
    for report_name, report, expected_split, is_promoted in report_expectations:
        if not isinstance(report, Mapping):
            continue
        provenance = report.get("provenance")
        if not isinstance(provenance, Mapping):
            errors.append(f"{report_name} report field 'provenance' must be an object")
            continue
        if not _valid_schema_version(provenance.get("schema_version")):
            errors.append(
                f"{report_name} provenance schema_version must be "
                f"{PROVENANCE_SCHEMA_VERSION}"
            )
        if provenance.get("dataset_sha256") != dataset_sha256:
            errors.append(
                f"{report_name} provenance does not match dataset {dataset_path}"
            )
        if provenance.get("split") != expected_split:
            errors.append(
                f"{report_name} provenance split must be {expected_split!r}, "
                f"got {provenance.get('split')!r}"
            )

        report_model = provenance.get("model")
        if not isinstance(report_model, Mapping):
            errors.append(f"{report_name} provenance field 'model' must be an object")
            continue
        if is_promoted:
            report_model_sha = report_model.get("sha256")
            if not _valid_sha256(report_model_sha):
                errors.append(
                    f"{report_name} provenance model.sha256 must be a lowercase "
                    "SHA-256 digest"
                )
            elif report_model_sha != candidate_model_sha256:
                errors.append(
                    f"{report_name} provenance model does not match the browser "
                    "candidate source model"
                )
        elif (
            report_model.get("id") != PRIMARY_BASE_MODEL_ID
            or report_model.get("revision") != PRIMARY_BASE_MODEL_REVISION
        ):
            errors.append(
                "baseline test provenance must identify the pinned Teapot baseline "
                f"{PRIMARY_BASE_MODEL_ID}@{PRIMARY_BASE_MODEL_REVISION}"
            )

    if errors:
        details = "\n".join(f"- {error}" for error in errors)
        raise ValueError(f"promotion provenance validation failed:\n{details}")


def _load_and_validate_promotion_reports(
    args: argparse.Namespace,
) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    baseline_test = _load_report(Path(args.baseline_report))
    promoted_validation = _load_report(Path(args.validation_report))
    promoted_test = _load_report(Path(args.test_report))
    validate_promotion_metrics(
        baseline_test=baseline_test,
        promoted_validation=promoted_validation,
        promoted_test=promoted_test,
    )
    validate_promotion_provenance(
        baseline_test=baseline_test,
        promoted_validation=promoted_validation,
        promoted_test=promoted_test,
        dataset_path=Path(args.dataset),
        model_browser_dir=Path(args.model_browser_dir),
    )
    validate_report_aggregates(
        baseline_test=baseline_test,
        promoted_validation=promoted_validation,
        promoted_test=promoted_test,
        dataset_records=read_jsonl(Path(args.dataset)),
    )
    return baseline_test, promoted_validation, promoted_test


def _metric(value: float) -> str:
    return f"{value:.4f}"


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
) -> None:
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

This model is a browser-oriented ONNX export of a local LoRA continuation from
`teapotai/teapotllm`. It is tuned for public resume/profile Q&A prompts that fit
within a 1024-token browser context budget.

Hugging Face model metadata uses the official `text-generation` task category;
the browser runtime still loads this T5-style export with the Transformers.js
`text2text-generation` pipeline.

The target use case is a static portfolio or resume site that runs inference in
the browser with Transformers.js, without API routes, hosted inference, server
actions, or cloud training. The profile schema is intentionally generic for repo
reuse: `identity`, `current_role`, `experience`, `projects`, `education`,
`recommendations`, `skills`, and `interests`.

## Browser Artifacts

The repository payload contains tokenizer/config files at the root and
Transformers.js ONNX files under `onnx/`:

- `encoder_model_int8.onnx`
- `decoder_model_merged_int8.onnx`
- `encoder_model_uint8.onnx`
- `decoder_model_merged_uint8.onnx`

The export gate rejects external `.onnx.data` files so the model can be loaded
as self-contained browser assets.

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
- Method: local LoRA/QLoRA continuation, no full fine-tune and no cloud training
- Promoted checkpoint: `teapot-profile-qa-lora-v5/checkpoint-40`
- LoRA: rank 16, alpha 32, dropout 0.03, target modules `q` and `v`
- 8GB-safe settings: 4-bit base loading, batch size 1, gradient accumulation 8,
  gradient checkpointing, short eval batches
- Final continuation window: train loss 0.0330 at step 40
- Best validation eval loss: 0.0287

## Software

- Training: PyTorch, Transformers, PEFT, bitsandbytes, Datasets
- Export: Optimum ONNX export, ONNX Runtime dynamic quantization
- Browser runtime: Transformers.js with ONNX Runtime Web/WASM
- Browser packaging: `text2text-generation-with-past` export with
  `decoder_model_merged` and subgraph-enabled ONNX quantization

## Hardware

Training was designed for a local 8GB NVIDIA laptop GPU profile, with GPU
health checks for `nvidia-smi`, `/dev/nvidia*`, CUDA-enabled PyTorch, and
`torch.cuda.is_available()`. Export and card preparation can run on CPU after
training completes.

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

- 2026-06-19: Initial local browser profile-QA export with `int8` and `uint8`
  ONNX variants.

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
    baseline_test, promoted_validation, promoted_test = (
        _load_and_validate_promotion_reports(args)
    )
    browser_dir = Path(args.model_browser_dir)
    if not browser_dir.exists():
        raise RuntimeError(f"model browser directory does not exist: {browser_dir}")
    reject_external_data_files(browser_dir)

    model_output_dir = Path(args.output_dir) / "model"
    _copy_tree_contents(browser_dir, model_output_dir)

    _write_model_card(
        model_output_dir / "README.md",
        model_repo_id=args.model_repo_id,
        dataset_repo_id=args.dataset_repo_id,
        baseline_test=baseline_test,
        promoted_validation=promoted_validation,
        promoted_test=promoted_test,
    )
    refresh_candidate_provenance(model_output_dir)
    reject_external_data_files(model_output_dir)
    return model_output_dir


def prepare_dataset_payload(args: argparse.Namespace) -> Path:
    baseline_test, promoted_validation, promoted_test = (
        _load_and_validate_promotion_reports(args)
    )
    records = read_jsonl(Path(args.dataset))
    dataset_output_dir = Path(args.output_dir) / "dataset"
    if dataset_output_dir.exists():
        shutil.rmtree(dataset_output_dir)
    dataset_output_dir.mkdir(parents=True, exist_ok=True)

    shutil.copy2(Path(args.dataset), dataset_output_dir / "profile_qa.jsonl")
    for split in ["train", "validation", "test"]:
        write_jsonl(
            dataset_output_dir / f"profile_qa_{split}.jsonl",
            _split_records(records, split),
        )
    _write_json(dataset_output_dir / "profile_sections.json", PROFILE_SECTIONS)

    reports_dir = dataset_output_dir / "eval_reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    for report_path in [
        Path(args.baseline_report),
        Path(args.validation_report),
        Path(args.test_report),
    ]:
        shutil.copy2(report_path, reports_dir / report_path.name)

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
        "--baseline-report",
        required=True,
    )
    parser.add_argument(
        "--validation-report",
        required=True,
    )
    parser.add_argument(
        "--test-report",
        required=True,
    )
    args = parser.parse_args()

    model_dir = prepare_model_payload(args)
    dataset_dir = prepare_dataset_payload(args)
    print(f"prepared model payload: {model_dir}")
    print(f"prepared dataset payload: {dataset_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
