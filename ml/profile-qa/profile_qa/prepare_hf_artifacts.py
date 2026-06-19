"""Prepare Hugging Face model and dataset repository payloads."""

from __future__ import annotations

import argparse
import json
import shutil
from collections import Counter
from pathlib import Path
from typing import Any

from .config import DEFAULT_DATASET_PATH, ONNX_DIR, PACKAGE_ROOT, REPORT_DIR
from .export_onnx import reject_external_data_files
from .public_profile import PROFILE_SECTIONS
from .validation import read_jsonl, write_jsonl

DEFAULT_MODEL_REPO_ID = "justinthelaw/teapot-profile-qa-browser-1024"
DEFAULT_DATASET_REPO_ID = "justinthelaw/profile-qa-synthetic-public-v1"


def _load_report(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


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
    browser_dir = Path(args.model_browser_dir)
    if not browser_dir.exists():
        raise RuntimeError(f"model browser directory does not exist: {browser_dir}")
    reject_external_data_files(browser_dir)

    model_output_dir = Path(args.output_dir) / "model"
    _copy_tree_contents(browser_dir, model_output_dir)

    baseline_test = _load_report(Path(args.baseline_report))
    promoted_validation = _load_report(Path(args.validation_report))
    promoted_test = _load_report(Path(args.test_report))
    _write_model_card(
        model_output_dir / "README.md",
        model_repo_id=args.model_repo_id,
        dataset_repo_id=args.dataset_repo_id,
        baseline_test=baseline_test,
        promoted_validation=promoted_validation,
        promoted_test=promoted_test,
    )
    reject_external_data_files(model_output_dir)
    return model_output_dir


def prepare_dataset_payload(args: argparse.Namespace) -> Path:
    records = read_jsonl(Path(args.dataset))
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
    for report_path in [
        Path(args.baseline_report),
        Path(args.validation_report),
        Path(args.test_report),
    ]:
        shutil.copy2(report_path, reports_dir / report_path.name)

    baseline_test = _load_report(Path(args.baseline_report))
    promoted_validation = _load_report(Path(args.validation_report))
    promoted_test = _load_report(Path(args.test_report))
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
        default=str(REPORT_DIR / "profile_qa_eval_baseline_test.json"),
    )
    parser.add_argument(
        "--validation-report",
        default=str(REPORT_DIR / "profile_qa_eval_v5_validation.json"),
    )
    parser.add_argument(
        "--test-report",
        default=str(REPORT_DIR / "profile_qa_eval_v5_test.json"),
    )
    args = parser.parse_args()

    model_dir = prepare_model_payload(args)
    dataset_dir = prepare_dataset_payload(args)
    print(f"prepared model payload: {model_dir}")
    print(f"prepared dataset payload: {dataset_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
