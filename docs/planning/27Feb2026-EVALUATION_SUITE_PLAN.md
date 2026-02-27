# Pipeline Evaluation Suite: Initial Implementation Plan

> [!NOTE]
> Historical planning document. The evaluation suite described here has been implemented in `pipeline/scripts/evaluate_model.py` and documented in `pipeline/README.md`.

## Why this is needed

The current pipeline evaluation (`pipeline/scripts/test_model.py`) is a manual smoke test:

- It picks one random prompt from `data/sft`.
- It prints model output vs expected output.
- It runs on available ONNX quantizations.

This is useful for quick sanity checks, but it does not provide:

- deterministic results for regression tracking
- pass/fail thresholds
- per-category quality metrics
- latency and throughput benchmarks
- artifact reports for CI or historical comparison

## Goals

1. Provide deterministic and repeatable model evaluation.
2. Measure quality across factual recall, instruction adherence, and out-of-scope handling.
3. Quantify runtime behavior across ONNX quantizations (quality vs speed tradeoffs).
4. Produce machine-readable reports and a concise human summary.
5. Allow gating for regressions in local workflows and CI.

## Non-goals (initial version)

- Building a full online evaluation platform or dashboard service.
- Using external paid judge APIs.
- Solving all hallucination detection with one metric.

## Proposed architecture

### 1. Evaluation data assets

Create a dedicated evaluation dataset under `pipeline/data/eval/`:

- `golden.jsonl`: manually curated high-value Q/A pairs from resume facts.
- `adversarial.jsonl`: tricky prompts (ambiguous wording, prompt injection attempts).
- `ood.jsonl`: out-of-domain prompts that should trigger safe refusal behavior.

Each record should include:

- `id`
- `category` (work_experience, skills, education, projects, leadership, achievements, character, military_service)
- `question`
- `reference_answer`
- `tags` (short_answer, date_fact, role_fact, refusal_expected, etc.)
- `expected_behavior` (`answer` or `refuse`)

Also keep generated holdout coverage:

- Reuse `data/sft/validation` as a large-scale recall benchmark.
- Sample deterministically with a fixed seed.

### 2. Evaluation harness

Add a new script:

- `pipeline/scripts/evaluate_model.py`

Responsibilities:

- load one or more model variants (fp32, int8, uint8, q4)
- load eval sets (`golden`, `adversarial`, `ood`, optional `validation_sample`)
- run deterministic generation settings (greedy, fixed max tokens)
- compute metrics and aggregate scorecards
- write reports to `pipeline/data/eval_reports/<timestamp>/`

Supporting modules (recommended):

- `pipeline/scripts/eval_metrics.py`
- `pipeline/scripts/eval_dataset.py`
- `pipeline/scripts/eval_reporting.py`

### 3. Metrics

Use multiple metrics; do not rely on one score.

Quality metrics (initial set):

- `exact_match_rate`: strict match for short factual answers.
- `token_f1`: lexical overlap against reference answers.
- `keyword_coverage`: presence of required entities from `reference_answer`/tags.
- `response_length_compliance`: within configured sentence/word limits.
- `refusal_accuracy`: for out-of-domain or unanswerable prompts.
- `category_pass_rate`: pass rate by category.

Runtime metrics:

- `mean_latency_ms`
- `p95_latency_ms`
- `tokens_per_second` (estimated from generated tokens/time)
- model file size comparison (already available via `get_model_size_mb`)

Quantization stability metric:

- Compare each quantized output against fp32 output on the same prompts.
- Track similarity deltas to identify degradation by quantization.

## Configuration additions

Extend `pipeline/config.yaml` with an `evaluation` block:

```yaml
evaluation:
  seed: 88
  smoke_samples: 50
  full_samples_per_set: 300
  max_new_tokens: 128
  thresholds:
    exact_match_rate_min: 0.35
    token_f1_min: 0.55
    keyword_coverage_min: 0.75
    refusal_accuracy_min: 0.90
    response_length_compliance_min: 0.95
    p95_latency_ms_max:
      model.onnx: 2500
      model_int8.onnx: 1800
      model_uint8.onnx: 1800
      model_q4.onnx: 1200
```

Threshold values above are placeholders and should be calibrated from baseline runs.

## Reporting format

For each run, generate:

- `summary.md`: human-readable highlights and regressions.
- `metrics.json`: full structured metrics by model and category.
- `failures.jsonl`: prompts that failed thresholds with outputs.
- `config_snapshot.json`: resolved config used for reproducibility.

Example report path:

- `pipeline/data/eval_reports/2026-02-27T103000Z/`

## Makefile and workflow integration

Add Make targets:

- `make eval-smoke` -> quick local regression check
- `make eval-full` -> comprehensive suite
- `make eval-compare` -> compare latest run against previous baseline

Suggested command mapping:

- `uv run python scripts/evaluate_model.py --suite smoke`
- `uv run python scripts/evaluate_model.py --suite full --fail-on-threshold`
- `uv run python scripts/evaluate_model.py --suite full --compare-to <report_dir>`

CI integration (after local stabilization):

- Run `eval-smoke` on PRs that touch `pipeline/`.
- Run `eval-full` on main/nightly and store artifacts.

## Phased implementation

### Phase 1: Deterministic baseline (quick win)

- Build `evaluate_model.py` with deterministic prompt selection and generation.
- Evaluate all ONNX variants on a fixed sample from `data/sft/validation`.
- Output `metrics.json` + `summary.md`.

Exit criteria:

- repeated runs with same seed produce identical prompt sets and near-identical scores.

### Phase 2: Golden set and category scorecards

- Add `pipeline/data/eval/golden.jsonl`.
- Add category/tag parsing and per-category metrics.
- Add failure case export (`failures.jsonl`).

Exit criteria:

- report includes per-category pass rates and top failure examples.

### Phase 3: Robustness and refusal behavior

- Add `adversarial.jsonl` and `ood.jsonl`.
- Implement refusal and instruction-adherence checks.
- Add threshold gating (`--fail-on-threshold`).

Exit criteria:

- command returns non-zero when any critical threshold is missed.

### Phase 4: Regression comparison and CI

- Add `--compare-to` support and delta reporting.
- Integrate `eval-smoke` in CI for pipeline-related changes.

Exit criteria:

- CI can catch evaluation regressions before merge.

## Risks and mitigations

- Overfitting to eval prompts:
  - keep eval sets separate from training generation loops
  - rotate and expand eval prompts over time
- Metric blind spots:
  - combine lexical, behavioral, and runtime metrics
  - review `failures.jsonl` regularly
- Runtime cost:
  - keep smoke suite small and deterministic
  - reserve full suite for nightly/main

## Initial task breakdown

1. Add `evaluation` config schema in `pipeline/scripts/utils.py`.
2. Implement `scripts/evaluate_model.py` with deterministic loading and report writing.
3. Add `pipeline/data/eval/golden.jsonl` starter set (30-50 prompts).
4. Add Makefile targets for smoke/full eval.
5. Document usage in `pipeline/README.md`.
6. Calibrate thresholds from 3-5 baseline runs and commit thresholds.

## Definition of done (initial milestone)

- `make eval-smoke` runs in under 5 minutes locally.
- Reports are written with reproducible metadata and clear pass/fail summary.
- At least one quality threshold and one latency threshold are enforced.
- Team can identify regressions between two runs without manual diffing.
