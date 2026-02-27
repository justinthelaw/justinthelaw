#!/usr/bin/env python3
"""Deterministic evaluation suite for ONNX model variants."""

from __future__ import annotations

import argparse
import json
import math
import sys
import time
from collections.abc import Mapping
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Protocol, cast

from eval_dataset import EvalCase, deterministic_sample, load_curated_eval_sets, load_validation_eval_set
from eval_metrics import CaseScores, score_case, token_f1
from eval_reporting import create_report_dir, write_json, write_jsonl
from huggingface_hub import HfApi
from optimum.onnxruntime import ORTModelForCausalLM
from transformers import AutoTokenizer
from utils import (
    CONFIG,
    EVAL_DATA_DIR,
    EVAL_MAX_NEW_TOKENS,
    EVAL_REPORT_OUTPUT,
    INFERENCE_REPETITION_PENALTY,
    MAX_ANSWER_SENTENCES,
    MAX_ANSWER_WORDS,
    PIPELINE_DIR,
    SYSTEM_PROMPT,
    get_model_size_mb,
)


@dataclass(slots=True)
class CaseResult:
    """Response and metrics for one model/case pair."""

    case: EvalCase
    response: str
    scores: CaseScores
    latency_ms: float
    generated_tokens: int
    failure_reasons: tuple[str, ...]


@dataclass(slots=True)
class ThresholdCheck:
    """Single threshold evaluation."""

    metric: str
    comparator: str
    actual: float
    expected: float
    passed: bool


@dataclass(slots=True)
class ModelSummary:
    """Aggregated model metrics across evaluation cases."""

    model_file: str
    model_size_mb: float
    total_cases: int
    answer_cases: int
    refusal_cases: int
    exact_match_rate: float
    token_f1: float
    keyword_coverage: float
    refusal_accuracy: float
    response_length_compliance: float
    behavior_accuracy: float
    mean_latency_ms: float
    p95_latency_ms: float
    tokens_per_second: float
    category_pass_rate: dict[str, float]
    failure_count: int
    fp32_alignment: float | None = None
    threshold_checks: list[ThresholdCheck] = field(default_factory=list)
    threshold_passed: bool = True


class TensorLike(Protocol):
    """Minimal tensor-like protocol for tokenizer/model outputs."""

    @property
    def shape(self) -> tuple[int, ...]:
        ...

    def __getitem__(self, key: object) -> TensorLike:
        ...


class ChatTokenizer(Protocol):
    """Minimal tokenizer protocol needed by evaluation harness."""

    eos_token_id: int | None

    def apply_chat_template(
        self,
        messages: list[dict[str, str]],
        tokenize: bool,
        add_generation_prompt: bool,
    ) -> str:
        ...

    def __call__(self, text: str, return_tensors: str) -> Mapping[str, TensorLike]:
        ...

    def decode(self, token_ids: TensorLike, skip_special_tokens: bool = True) -> str:
        ...


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(description='Evaluate ONNX quantized model variants')
    parser.add_argument(
        '--suite',
        choices=['smoke', 'full'],
        default='smoke',
        help='Evaluation suite size',
    )
    parser.add_argument(
        '--models',
        nargs='*',
        default=None,
        help='Specific ONNX model files to test (default: known variants that exist)',
    )
    parser.add_argument(
        '--compare-to',
        type=Path,
        default=None,
        help='Compare against a previous report directory (contains metrics.json)',
    )
    parser.add_argument(
        '--report-dir',
        type=Path,
        default=None,
        help='Override report output base directory',
    )
    parser.add_argument(
        '--fail-on-threshold',
        action='store_true',
        help='Exit non-zero if any configured threshold fails',
    )
    parser.add_argument(
        '--seed',
        type=int,
        default=None,
        help='Override evaluation seed',
    )
    parser.add_argument(
        '--hub-snapshot',
        dest='hub_snapshot',
        action='store_true',
        help='Fetch Hugging Face published asset metadata snapshot (disabled by default)',
    )
    parser.add_argument(
        '--skip-hub-snapshot',
        dest='hub_snapshot',
        action='store_false',
        help='Skip Hugging Face published asset metadata snapshot (default)',
    )
    parser.set_defaults(hub_snapshot=False)
    return parser.parse_args()


def _case_key(case: EvalCase) -> str:
    return f'{case.dataset}:{case.case_id}'


def _safe_mean(values: list[float]) -> float:
    if not values:
        return 0.0
    return sum(values) / len(values)


def _p95(values: list[float]) -> float:
    if not values:
        return 0.0
    sorted_values = sorted(values)
    index = max(0, math.ceil(0.95 * len(sorted_values)) - 1)
    return sorted_values[index]


def _resolve_model_files(onnx_path: Path, requested_models: list[str] | None) -> list[str]:
    """Resolve model filenames to evaluate."""
    default_order = [
        'model.onnx',
        'model_int8.onnx',
        'model_uint8.onnx',
        'model_q4.onnx',
    ]
    candidates = requested_models if requested_models else default_order

    resolved: list[str] = []
    for model_file in candidates:
        model_path = onnx_path / model_file
        if model_path.exists():
            resolved.append(model_file)
        else:
            print(f'Warning: Skipping missing model file {model_file}')
    return resolved


def _select_cases(suite: str, seed: int, sft_dataset_path: Path, curated_eval_dir: Path) -> tuple[list[EvalCase], dict[str, int]]:
    """Load and sample evaluation cases for a suite."""
    evaluation_cfg = CONFIG['evaluation']
    per_set_limit = evaluation_cfg['smoke_samples'] if suite == 'smoke' else evaluation_cfg['full_samples_per_set']

    curated_sets = load_curated_eval_sets(curated_eval_dir)
    selected_cases: list[EvalCase] = []
    case_counts: dict[str, int] = {}

    for index, dataset_name in enumerate(sorted(curated_sets)):
        dataset_cases = curated_sets[dataset_name]
        sampled = deterministic_sample(dataset_cases, per_set_limit, seed + index)
        selected_cases.extend(sampled)
        case_counts[dataset_name] = len(sampled)

    validation_cases = load_validation_eval_set(sft_dataset_path, per_set_limit, seed + 1000)
    selected_cases.extend(validation_cases)
    case_counts['validation'] = len(validation_cases)

    return selected_cases, case_counts


def _generate_response(
    model: ORTModelForCausalLM,
    tokenizer: ChatTokenizer,
    question: str,
    max_new_tokens: int,
) -> tuple[str, int, float]:
    """Generate a model response and return text, token count, and latency."""
    messages = [
        {'role': 'system', 'content': SYSTEM_PROMPT},
        {'role': 'user', 'content': question},
    ]
    prompt = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer(prompt, return_tensors='pt')
    generate_kwargs: dict[str, int | float | bool] = {
        'max_new_tokens': max_new_tokens,
        'do_sample': False,
        'repetition_penalty': INFERENCE_REPETITION_PENALTY,
    }

    if tokenizer.eos_token_id is not None:
        generate_kwargs['pad_token_id'] = tokenizer.eos_token_id

    started_at = time.perf_counter()
    outputs = model.generate(**inputs, **generate_kwargs)
    latency_ms = (time.perf_counter() - started_at) * 1000

    input_ids = inputs['input_ids']
    input_token_count = int(input_ids.shape[-1])
    generated_ids = cast(TensorLike, outputs[0][input_token_count:])
    generated_tokens = int(generated_ids.shape[-1])
    response = tokenizer.decode(generated_ids, skip_special_tokens=True).strip()
    return response, generated_tokens, latency_ms


def _collect_failure_reasons(case: EvalCase, response: str, scores: CaseScores) -> tuple[str, ...]:
    """Compute deterministic case-level failure reasons."""
    reasons: list[str] = []
    thresholds = CONFIG['evaluation']['thresholds']

    if not response.strip():
        reasons.append('empty_response')
    if not scores.behavior_correct:
        reasons.append('behavior_mismatch')
    if not scores.response_length_compliant:
        reasons.append('response_length_violation')

    if case.expected_behavior == 'answer':
        if scores.token_f1 < thresholds['case_token_f1_min']:
            reasons.append('token_f1_below_case_threshold')
        if scores.keyword_coverage < thresholds['case_keyword_coverage_min']:
            reasons.append('keyword_coverage_below_case_threshold')

    return tuple(reasons)


def _aggregate_summary(model_file: str, model_size_mb: float, results: list[CaseResult]) -> ModelSummary:
    """Aggregate per-case results into model summary metrics."""
    answer_results = [result for result in results if result.case.expected_behavior == 'answer']
    refusal_results = [result for result in results if result.case.expected_behavior == 'refuse']

    exact_match_values = [result.scores.exact_match for result in answer_results]
    token_f1_values = [result.scores.token_f1 for result in answer_results]
    keyword_values = [result.scores.keyword_coverage for result in answer_results]
    refusal_values = [1.0 if result.scores.behavior_correct else 0.0 for result in refusal_results]
    length_values = [1.0 if result.scores.response_length_compliant else 0.0 for result in results]
    behavior_values = [1.0 if result.scores.behavior_correct else 0.0 for result in results]
    latency_values = [result.latency_ms for result in results]

    total_generated_tokens = sum(result.generated_tokens for result in results)
    total_generation_seconds = sum(result.latency_ms for result in results) / 1000
    tokens_per_second = (
        total_generated_tokens / total_generation_seconds if total_generation_seconds > 0 else 0.0
    )

    category_totals: dict[str, int] = {}
    category_passed: dict[str, int] = {}
    for result in results:
        category = result.case.category
        category_totals[category] = category_totals.get(category, 0) + 1
        if not result.failure_reasons:
            category_passed[category] = category_passed.get(category, 0) + 1

    category_pass_rate = {
        category: category_passed.get(category, 0) / total
        for category, total in sorted(category_totals.items())
    }

    return ModelSummary(
        model_file=model_file,
        model_size_mb=model_size_mb,
        total_cases=len(results),
        answer_cases=len(answer_results),
        refusal_cases=len(refusal_results),
        exact_match_rate=_safe_mean(exact_match_values),
        token_f1=_safe_mean(token_f1_values),
        keyword_coverage=_safe_mean(keyword_values),
        refusal_accuracy=_safe_mean(refusal_values),
        response_length_compliance=_safe_mean(length_values),
        behavior_accuracy=_safe_mean(behavior_values),
        mean_latency_ms=_safe_mean(latency_values),
        p95_latency_ms=_p95(latency_values),
        tokens_per_second=tokens_per_second,
        category_pass_rate=category_pass_rate,
        failure_count=sum(1 for result in results if result.failure_reasons),
    )


def _evaluate_one_model(
    onnx_path: Path,
    tokenizer: ChatTokenizer,
    model_file: str,
    cases: list[EvalCase],
    max_new_tokens: int,
) -> tuple[ModelSummary, list[CaseResult]]:
    """Run one ONNX model across all evaluation cases."""
    model_path = onnx_path / model_file
    model_size_mb = get_model_size_mb(model_path)

    print(f'\nEvaluating {model_file} ({model_size_mb:.1f} MB) on {len(cases)} cases')
    model = ORTModelForCausalLM.from_pretrained(str(onnx_path), file_name=model_file)

    refusal_markers = CONFIG['evaluation']['refusal_markers']
    results: list[CaseResult] = []

    for index, case in enumerate(cases, start=1):
        if index % 25 == 0 or index == len(cases):
            print(f'  Progress: {index}/{len(cases)}')

        response, generated_tokens, latency_ms = _generate_response(
            model=model,
            tokenizer=tokenizer,
            question=case.question,
            max_new_tokens=max_new_tokens,
        )
        scores = score_case(
            case=case,
            response=response,
            refusal_markers=refusal_markers,
            max_sentences=MAX_ANSWER_SENTENCES,
            max_words=MAX_ANSWER_WORDS,
        )
        failure_reasons = _collect_failure_reasons(case=case, response=response, scores=scores)
        results.append(
            CaseResult(
                case=case,
                response=response,
                scores=scores,
                latency_ms=latency_ms,
                generated_tokens=generated_tokens,
                failure_reasons=failure_reasons,
            )
        )

    summary = _aggregate_summary(model_file=model_file, model_size_mb=model_size_mb, results=results)
    return summary, results


def _apply_fp32_alignment(
    summaries: dict[str, ModelSummary],
    results_by_model: dict[str, list[CaseResult]],
) -> None:
    """Attach fp32 alignment metrics to all model summaries."""
    fp32_name = 'model.onnx'
    if fp32_name not in results_by_model:
        return

    fp32_outputs = {
        _case_key(result.case): result.response
        for result in results_by_model[fp32_name]
    }

    for model_file, model_results in results_by_model.items():
        if model_file == fp32_name:
            summaries[model_file].fp32_alignment = 1.0
            continue

        alignments: list[float] = []
        for result in model_results:
            key = _case_key(result.case)
            fp32_response = fp32_outputs.get(key)
            if fp32_response is None:
                continue
            alignments.append(token_f1(fp32_response, result.response))

        summaries[model_file].fp32_alignment = _safe_mean(alignments) if alignments else None


def _run_threshold_checks(summary: ModelSummary) -> None:
    """Populate threshold checks for one model summary."""
    thresholds = CONFIG['evaluation']['thresholds']
    checks: list[ThresholdCheck] = []

    def add_check(metric: str, comparator: str, actual: float, expected: float, passed: bool) -> None:
        checks.append(
            ThresholdCheck(
                metric=metric,
                comparator=comparator,
                actual=actual,
                expected=expected,
                passed=passed,
            )
        )

    add_check(
        metric='exact_match_rate',
        comparator='>=',
        actual=summary.exact_match_rate,
        expected=thresholds['exact_match_rate_min'],
        passed=summary.exact_match_rate >= thresholds['exact_match_rate_min'],
    )
    add_check(
        metric='token_f1',
        comparator='>=',
        actual=summary.token_f1,
        expected=thresholds['token_f1_min'],
        passed=summary.token_f1 >= thresholds['token_f1_min'],
    )
    add_check(
        metric='keyword_coverage',
        comparator='>=',
        actual=summary.keyword_coverage,
        expected=thresholds['keyword_coverage_min'],
        passed=summary.keyword_coverage >= thresholds['keyword_coverage_min'],
    )
    add_check(
        metric='response_length_compliance',
        comparator='>=',
        actual=summary.response_length_compliance,
        expected=thresholds['response_length_compliance_min'],
        passed=summary.response_length_compliance >= thresholds['response_length_compliance_min'],
    )
    add_check(
        metric='behavior_accuracy',
        comparator='>=',
        actual=summary.behavior_accuracy,
        expected=thresholds['behavior_accuracy_min'],
        passed=summary.behavior_accuracy >= thresholds['behavior_accuracy_min'],
    )

    if summary.refusal_cases > 0:
        add_check(
            metric='refusal_accuracy',
            comparator='>=',
            actual=summary.refusal_accuracy,
            expected=thresholds['refusal_accuracy_min'],
            passed=summary.refusal_accuracy >= thresholds['refusal_accuracy_min'],
        )

    if summary.model_file != 'model.onnx' and summary.fp32_alignment is not None:
        add_check(
            metric='fp32_alignment',
            comparator='>=',
            actual=summary.fp32_alignment,
            expected=thresholds['fp32_alignment_min'],
            passed=summary.fp32_alignment >= thresholds['fp32_alignment_min'],
        )

    latency_budget = thresholds['p95_latency_ms_max'].get(summary.model_file)
    if latency_budget is not None:
        add_check(
            metric='p95_latency_ms',
            comparator='<=',
            actual=summary.p95_latency_ms,
            expected=latency_budget,
            passed=summary.p95_latency_ms <= latency_budget,
        )

    summary.threshold_checks = checks
    summary.threshold_passed = all(check.passed for check in checks)


def _serialize_model_summary(summary: ModelSummary) -> dict[str, object]:
    """Convert model summary dataclass to JSON-serializable structure."""
    return {
        'model_size_mb': round(summary.model_size_mb, 3),
        'total_cases': summary.total_cases,
        'answer_cases': summary.answer_cases,
        'refusal_cases': summary.refusal_cases,
        'metrics': {
            'exact_match_rate': round(summary.exact_match_rate, 6),
            'token_f1': round(summary.token_f1, 6),
            'keyword_coverage': round(summary.keyword_coverage, 6),
            'refusal_accuracy': round(summary.refusal_accuracy, 6),
            'response_length_compliance': round(summary.response_length_compliance, 6),
            'behavior_accuracy': round(summary.behavior_accuracy, 6),
            'mean_latency_ms': round(summary.mean_latency_ms, 3),
            'p95_latency_ms': round(summary.p95_latency_ms, 3),
            'tokens_per_second': round(summary.tokens_per_second, 3),
            'fp32_alignment': round(summary.fp32_alignment, 6) if summary.fp32_alignment is not None else None,
        },
        'category_pass_rate': {key: round(value, 6) for key, value in summary.category_pass_rate.items()},
        'failure_count': summary.failure_count,
        'threshold_checks': [
            {
                'metric': check.metric,
                'comparator': check.comparator,
                'actual': round(check.actual, 6),
                'expected': round(check.expected, 6),
                'passed': check.passed,
            }
            for check in summary.threshold_checks
        ],
        'threshold_passed': summary.threshold_passed,
    }


def _serialize_case_failure(model_file: str, result: CaseResult) -> dict[str, object]:
    """Serialize one failing case."""
    return {
        'model_file': model_file,
        'case_id': result.case.case_id,
        'dataset': result.case.dataset,
        'category': result.case.category,
        'question': result.case.question,
        'reference_answer': result.case.reference_answer,
        'expected_behavior': result.case.expected_behavior,
        'response': result.response,
        'tags': list(result.case.tags),
        'latency_ms': round(result.latency_ms, 3),
        'generated_tokens': result.generated_tokens,
        'metrics': {
            'exact_match': round(result.scores.exact_match, 6),
            'token_f1': round(result.scores.token_f1, 6),
            'keyword_coverage': round(result.scores.keyword_coverage, 6),
            'response_length_compliant': result.scores.response_length_compliant,
            'is_refusal': result.scores.is_refusal,
            'behavior_correct': result.scores.behavior_correct,
        },
        'failure_reasons': list(result.failure_reasons),
    }


def _load_baseline_metrics(compare_dir: Path) -> dict[str, Mapping[str, object]] | None:
    """Load baseline model metrics from previous report."""
    metrics_path = compare_dir / 'metrics.json'
    if not metrics_path.exists():
        print(f'Warning: Comparison file not found at {metrics_path}')
        return None

    try:
        payload = json.loads(metrics_path.read_text(encoding='utf-8'))
    except json.JSONDecodeError:
        print(f'Warning: Could not parse baseline metrics at {metrics_path}')
        return None

    if not isinstance(payload, dict):
        return None
    models = payload.get('models')
    if not isinstance(models, dict):
        return None

    typed_models: dict[str, Mapping[str, object]] = {}
    for key, value in models.items():
        if isinstance(key, str) and isinstance(value, dict):
            typed_models[key] = value
    return typed_models


def _extract_baseline_metric(model_payload: Mapping[str, object], metric: str) -> float | None:
    """Extract a numeric baseline metric from payload."""
    metrics_obj = model_payload.get('metrics')
    if not isinstance(metrics_obj, dict):
        return None
    value = metrics_obj.get(metric)
    if isinstance(value, (int, float)):
        return float(value)
    return None


def _compute_comparison(
    summaries: dict[str, ModelSummary],
    baseline_models: dict[str, Mapping[str, object]] | None,
) -> dict[str, dict[str, float]]:
    """Compute metric deltas versus baseline report."""
    if baseline_models is None:
        return {}

    tracked_metrics = [
        'exact_match_rate',
        'token_f1',
        'keyword_coverage',
        'refusal_accuracy',
        'response_length_compliance',
        'behavior_accuracy',
        'p95_latency_ms',
        'tokens_per_second',
        'fp32_alignment',
    ]

    comparison: dict[str, dict[str, float]] = {}
    for model_file, summary in summaries.items():
        baseline_payload = baseline_models.get(model_file)
        if baseline_payload is None:
            continue

        current_metrics = _serialize_model_summary(summary)['metrics']
        if not isinstance(current_metrics, dict):
            continue

        deltas: dict[str, float] = {}
        for metric in tracked_metrics:
            current_value_obj = current_metrics.get(metric)
            baseline_value = _extract_baseline_metric(baseline_payload, metric)
            if not isinstance(current_value_obj, (int, float)) or baseline_value is None:
                continue
            deltas[metric] = float(current_value_obj) - baseline_value

        if deltas:
            comparison[model_file] = deltas

    return comparison


def _safe_iso_datetime(value: object) -> str | None:
    """Convert datetime-like values to ISO8601 string."""
    if not isinstance(value, datetime):
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc).isoformat()  # noqa: UP017
    return value.isoformat()


def _fetch_hub_snapshot() -> dict[str, object]:
    """Fetch published Hugging Face model and dataset metadata."""
    snapshot: dict[str, object] = {
        'checked_at': datetime.now(tz=timezone.utc).isoformat(),  # noqa: UP017
        'model': None,
        'dataset': None,
    }
    api = HfApi()
    hub_cfg = CONFIG['evaluation']['hub']

    model_id = hub_cfg['model_id']
    try:
        model_info = api.model_info(model_id)
        model_siblings = model_info.siblings or []
        model_tags = model_info.tags or []
        snapshot['model'] = {
            'id': model_info.id,
            'sha': model_info.sha,
            'last_modified': _safe_iso_datetime(model_info.last_modified),
            'downloads': model_info.downloads,
            'likes': model_info.likes,
            'file_count': len(model_siblings),
            'tags': model_tags[:20],
        }
    except Exception as exc:
        snapshot['model'] = {'id': model_id, 'error': str(exc)}

    dataset_id = hub_cfg['dataset_id']
    try:
        dataset_info = api.dataset_info(dataset_id)
        dataset_siblings = dataset_info.siblings or []
        dataset_tags = dataset_info.tags or []
        snapshot['dataset'] = {
            'id': dataset_info.id,
            'sha': dataset_info.sha,
            'last_modified': _safe_iso_datetime(dataset_info.last_modified),
            'downloads': dataset_info.downloads,
            'likes': dataset_info.likes,
            'file_count': len(dataset_siblings),
            'tags': dataset_tags[:20],
        }
    except Exception as exc:
        snapshot['dataset'] = {'id': dataset_id, 'error': str(exc)}

    return snapshot


def _build_summary_markdown(
    suite: str,
    report_dir: Path,
    case_counts: dict[str, int],
    summaries: dict[str, ModelSummary],
    overall_passed: bool,
    comparison: dict[str, dict[str, float]],
    compare_to: Path | None,
) -> str:
    """Build human-readable markdown summary."""
    lines: list[str] = []
    lines.append('# Evaluation Summary')
    lines.append('')
    lines.append(f'- Suite: `{suite}`')
    lines.append(f'- Generated at: `{datetime.now(tz=timezone.utc).isoformat()}`')  # noqa: UP017
    lines.append(f'- Report directory: `{report_dir}`')
    lines.append(f'- Overall threshold status: `{"PASS" if overall_passed else "FAIL"}`')
    lines.append('')
    lines.append('## Case Coverage')
    lines.append('')
    for dataset_name in sorted(case_counts):
        lines.append(f'- `{dataset_name}`: {case_counts[dataset_name]} cases')
    lines.append('')
    lines.append('## Model Metrics')
    lines.append('')
    lines.append(
        '| model | cases | exact | token_f1 | keyword | refusal | behavior | p95 ms | tok/s | fp32 align | failures | thresholds |'
    )
    lines.append(
        '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|'
    )
    for model_file in sorted(summaries):
        summary = summaries[model_file]
        fp32_alignment = f'{summary.fp32_alignment:.3f}' if summary.fp32_alignment is not None else 'n/a'
        lines.append(
            f'| `{model_file}` | {summary.total_cases} | {summary.exact_match_rate:.3f} | '
            f'{summary.token_f1:.3f} | {summary.keyword_coverage:.3f} | {summary.refusal_accuracy:.3f} | '
            f'{summary.behavior_accuracy:.3f} | {summary.p95_latency_ms:.1f} | {summary.tokens_per_second:.2f} | '
            f'{fp32_alignment} | {summary.failure_count} | {"PASS" if summary.threshold_passed else "FAIL"} |'
        )
    lines.append('')
    lines.append('## Threshold Checks')
    lines.append('')
    for model_file in sorted(summaries):
        lines.append(f'### `{model_file}`')
        lines.append('')
        summary = summaries[model_file]
        for check in summary.threshold_checks:
            status = 'PASS' if check.passed else 'FAIL'
            lines.append(
                f'- {status}: `{check.metric}` {check.comparator} `{check.expected:.3f}` '
                f'(actual `{check.actual:.3f}`)'
            )
        lines.append('')

    if comparison:
        compare_label = str(compare_to) if compare_to is not None else 'baseline report'
        lines.append('## Comparison')
        lines.append('')
        lines.append(f'- Compared to: `{compare_label}`')
        lines.append('')
        for model_file in sorted(comparison):
            lines.append(f'### `{model_file}` deltas')
            lines.append('')
            for metric, delta in sorted(comparison[model_file].items()):
                lines.append(f'- `{metric}`: `{delta:+.4f}`')
            lines.append('')

    return '\n'.join(lines)


def main() -> int:
    """Run evaluation suite."""
    args = parse_args()

    onnx_path = PIPELINE_DIR / CONFIG.get('onnx_output', 'models/onnx')
    sft_dataset_path = PIPELINE_DIR / CONFIG['dataset_output'] / 'sft'
    eval_data_dir = PIPELINE_DIR / EVAL_DATA_DIR
    report_base_dir = args.report_dir if args.report_dir else (PIPELINE_DIR / EVAL_REPORT_OUTPUT)

    if not onnx_path.exists():
        print(f'Error: ONNX model directory not found at {onnx_path}')
        return 1

    selected_seed = args.seed if args.seed is not None else CONFIG['evaluation']['seed']
    cases, case_counts = _select_cases(
        suite=args.suite,
        seed=selected_seed,
        sft_dataset_path=sft_dataset_path,
        curated_eval_dir=eval_data_dir,
    )
    if not cases:
        print(
            'Error: No evaluation cases available. '
            f'Expected curated cases under {eval_data_dir} and/or dataset split at {sft_dataset_path}.'
        )
        return 1

    model_files = _resolve_model_files(onnx_path=onnx_path, requested_models=args.models)
    if not model_files:
        print('Error: No ONNX model files available for evaluation')
        return 1

    print(f'Evaluation suite: {args.suite}')
    print(f'Seed: {selected_seed}')
    print(f'Total cases: {len(cases)}')
    print(f'Models: {", ".join(model_files)}')

    tokenizer = cast(ChatTokenizer, AutoTokenizer.from_pretrained(str(onnx_path)))
    max_new_tokens = CONFIG['evaluation'].get('max_new_tokens', EVAL_MAX_NEW_TOKENS)

    summaries: dict[str, ModelSummary] = {}
    results_by_model: dict[str, list[CaseResult]] = {}
    for model_file in model_files:
        summary, model_results = _evaluate_one_model(
            onnx_path=onnx_path,
            tokenizer=tokenizer,
            model_file=model_file,
            cases=cases,
            max_new_tokens=max_new_tokens,
        )
        summaries[model_file] = summary
        results_by_model[model_file] = model_results

    _apply_fp32_alignment(summaries=summaries, results_by_model=results_by_model)
    for summary in summaries.values():
        _run_threshold_checks(summary)

    overall_passed = all(summary.threshold_passed for summary in summaries.values())
    baseline_models = _load_baseline_metrics(args.compare_to) if args.compare_to else None
    comparison = _compute_comparison(summaries=summaries, baseline_models=baseline_models)
    hub_snapshot = _fetch_hub_snapshot() if args.hub_snapshot else {}

    report_dir = create_report_dir(report_base_dir)
    failures: list[dict[str, object]] = []
    for model_file, model_results in results_by_model.items():
        for result in model_results:
            if not result.failure_reasons:
                continue
            failures.append(_serialize_case_failure(model_file=model_file, result=result))

    metrics_payload: dict[str, object] = {
        'suite': args.suite,
        'generated_at': datetime.now(tz=timezone.utc).isoformat(),  # noqa: UP017
        'seed': selected_seed,
        'overall_threshold_passed': overall_passed,
        'case_counts': case_counts,
        'total_cases': len(cases),
        'models': {
            model_file: _serialize_model_summary(summary)
            for model_file, summary in summaries.items()
        },
        'comparison': comparison,
        'compare_to': str(args.compare_to) if args.compare_to else None,
        'hub_snapshot': hub_snapshot,
    }

    config_snapshot: dict[str, object] = {
        'evaluation': CONFIG['evaluation'],
        'onnx_path': str(onnx_path),
        'sft_dataset_path': str(sft_dataset_path),
        'eval_data_dir': str(eval_data_dir),
        'models_evaluated': model_files,
        'system_prompt': SYSTEM_PROMPT,
    }

    summary_markdown = _build_summary_markdown(
        suite=args.suite,
        report_dir=report_dir,
        case_counts=case_counts,
        summaries=summaries,
        overall_passed=overall_passed,
        comparison=comparison,
        compare_to=args.compare_to,
    )

    write_json(report_dir / 'metrics.json', metrics_payload)
    write_json(report_dir / 'config_snapshot.json', config_snapshot)
    write_jsonl(report_dir / 'failures.jsonl', failures)
    (report_dir / 'summary.md').write_text(summary_markdown, encoding='utf-8')

    print('\nEvaluation complete')
    print(f'Report directory: {report_dir}')
    print(f'Overall thresholds: {"PASS" if overall_passed else "FAIL"}')

    if args.fail_on_threshold and not overall_passed:
        return 2
    return 0


if __name__ == '__main__':
    sys.exit(main())
