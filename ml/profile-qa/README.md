# Local NVIDIA Profile-QA Pipeline

Local-only training and promotion for a browser Q&A model with a 1024-token
prompt budget. Generated data, checkpoints, merged weights, ONNX files, and
reports are git-ignored. See the [system flow](../../docs/DIAGRAMS.md).

Facts live only in `src/config/public-profile.json`, loaded by
`src/config/site.ts` and `profile_qa/public_profile.py`. Keep generic section IDs
ordered `identity`, `current_role`, `experience`, `projects`, `education`,
`recommendations`, `skills`, `interests`; experience outranks education, and
recommendations precede hobbies/personality. Names/employers belong in facts
and keywords. Keep browser priorities/keywords with evaluation `terms`.

`identity.subject` supplies browser/training names and pronouns. Update matching
QA templates in `profile_qa/synthetic_data.py` when changed facts invalidate
employer, school, product, or role references. Each grouped QA entry must select
a named `termGroup` per evidence fact with the minimum terms every variant
requires; missing selectors and broad `all_evidence_terms` scoring are rejected.

## Prerequisites

| Need | Detail |
| --- | --- |
| NVIDIA access | Run from a host shell with visible `/dev/nvidia*` devices or a container with NVIDIA device passthrough |
| CUDA | CUDA-enabled PyTorch wheels are sufficient for v1; `nvcc` is optional unless a dependency needs CUDA extension compilation |
| Python | Use the version pinned in the repository `.python-version` |

```bash
uv python install
uv venv ml/profile-qa/.venv
uv pip sync --python ml/profile-qa/.venv --require-hashes ml/profile-qa/requirements.lock
uv venv ml/profile-qa/.venv-export
uv pip sync --python ml/profile-qa/.venv-export --require-hashes \
  ml/profile-qa/requirements-export.lock
. ml/profile-qa/.venv/bin/activate
```

Refresh changed manifests with Python 3.14 and the uv version pinned in
`.github/workflows/ml.test.yml`:

```bash
uv pip compile --python-version 3.14 --generate-hashes \
  --output-file ml/profile-qa/requirements.lock \
  ml/profile-qa/requirements.txt
uv pip compile --python-version 3.14 --generate-hashes \
  --output-file ml/profile-qa/requirements-export.lock \
  ml/profile-qa/requirements-export.txt
```

Commit manifests with regenerated hash locks; CI installs locks, checks their
consistency, recreates both environments, and audits both graphs without
exceptions. Training needs Accelerate ≥1.15 to exclude
[PYSEC-2026-3804](https://github.com/pypa/advisory-database/blob/main/vulns/accelerate/PYSEC-2026-3804.yaml).

Training/export use the locked Transformers and Hub versions. The smaller
export environment uses native `torch.export` and ONNX Runtime, without Optimum;
export only this pipeline's verified local merged model.

## Commands

```bash
PYTHONPATH=ml/profile-qa python -m profile_qa.gpu_health
PYTHONPATH=ml/profile-qa python -m profile_qa.synthetic_data --output ml/profile-qa/data/profile_qa.jsonl
PYTHONPATH=ml/profile-qa python -m profile_qa.train_lora --dataset ml/profile-qa/data/profile_qa.jsonl
PYTHONPATH=ml/profile-qa python -m profile_qa.evaluate \
  --dataset ml/profile-qa/data/profile_qa.jsonl \
  --model-id teapotai/teapotllm \
  --split test \
  --output ml/profile-qa/reports/profile_qa_eval_baseline_test.json
PYTHONPATH=ml/profile-qa python -m profile_qa.evaluate \
  --dataset ml/profile-qa/data/profile_qa.jsonl \
  --model-id ml/profile-qa/checkpoints/teapot-profile-qa-lora/checkpoint-400 \
  --split validation \
  --output ml/profile-qa/reports/profile_qa_eval_candidate_validation.json
PYTHONPATH=ml/profile-qa python -m profile_qa.evaluate \
  --dataset ml/profile-qa/data/profile_qa.jsonl \
  --model-id ml/profile-qa/checkpoints/teapot-profile-qa-lora/checkpoint-400 \
  --split test \
  --output ml/profile-qa/reports/profile_qa_eval_candidate_test.json
PYTHONPATH=ml/profile-qa python -m profile_qa.merge_adapter --adapter-model-id ml/profile-qa/checkpoints/teapot-profile-qa-lora/checkpoint-400 --output-dir ml/profile-qa/merged/teapot-profile-qa
PYTHONPATH=ml/profile-qa ml/profile-qa/.venv-export/bin/python -m profile_qa.export_onnx --output-dir ml/profile-qa/onnx/candidate
PYTHONPATH=ml/profile-qa python -m profile_qa.prepare_hf_artifacts \
  --model-browser-dir ml/profile-qa/onnx/candidate/browser \
  --lineage-file ml/profile-qa/merged/teapot-profile-qa/teapot_profile_qa_lineage.json \
  --release-date YYYY-MM-DD
PYTHONPATH=ml/profile-qa python -m profile_qa.publish --repo-id justinthelaw/teapot-profile-qa-browser-1024 --artifact-dir ml/profile-qa/hf/model
PYTHONPATH=ml/profile-qa python -m profile_qa.publish --repo-type dataset --repo-id justinthelaw/profile-qa-synthetic-public-v1 --artifact-dir ml/profile-qa/hf/dataset
```

## Artifact Safeguards

- Teapot only: train from `teapotai/teapotllm` and persist its pinned revision in
  every PEFT checkpoint/final adapter. Continuation, resume, evaluation,
  generation, merge, and packaging reject missing/different base metadata.
- Merge only to a disjoint output tree: equal, ancestor, descendant, and
  symlinked paths are rejected. Valid output trees are replaced to exclude
  stale files. Export consumes this verified local merge.
- `profile_qa/native_t5_onnx.py` produces `encoder_model.onnx` and
  `decoder_model_merged.onnx` with dynamic shapes and initial/cached T5 decoding.
  Model cards use `pipeline_tag: text2text-generation`, matching the worker.
- Reports bind the canonical published-dataset SHA-256, exact formatted prompts,
  split, base revision, adapter/merged-model digest, generation settings and
  implementation digest, plus scoring schema/normalized-token digest. Packaging
  recomputes metrics from saved per-record predictions with the current scorer.
- Merge records revision and adapter/model hashes. Export verifies lineage and
  content at FP, quantized, and browser stages; quantization also records its
  exact FP input digest. Public source-lineage digests use sanitized portable
  labels, excluding private checkpoint paths from both payload and digest.
- Packaging accepts only the publishable provenance schema. Validation/test
  reports must identify the same adapter or merged representation and match the
  selected dataset, live prompts, revision, checkpoint label, and model digests.
  Browser markers must match the actual files.
- Before replacing either payload, packaging requires ≥15% test-macro improvement
  over baseline and ≥95% refusal/≥80% multi-turn scores on both validation and
  test. Output must not overlap the dataset, reports, lineage, browser artifact,
  or selected checkpoint.
- Recovery flags `--skip-export`/`--skip-quantize` require valid stage lineage
  and content digests. Quantized outputs from another FP export are rejected,
  even with the same merged lineage. Regenerate stale/legacy files; never relabel.
- Packaging derives latest train/best validation loss from the lineage-selected
  checkpoint's `trainer_state.json`, and LoRA rank/alpha/dropout/targets from its
  digest-validated `adapter_config.json`. Omit unverified hardware, optimizer,
  quantization, and batch-size claims. Per-module rank/alpha, DoRA/RS-LoRA,
  trained bias, and saved extra modules fail closed rather than misstate LoRA.
- Supply ISO `--release-date YYYY-MM-DD`. Missing, mismatched, stale, or malformed
  provenance stops preparation before payload replacement.
- Reuse predictions through a `--save-predictions-json` bundle.
  `--predictions-json` verifies model, canonical dataset, split, exact record IDs,
  prompts, generation settings, and implementation. Plain/stale mappings fail.

For targeted continuation from an existing LoRA adapter:

```bash
PYTHONPATH=ml/profile-qa python -m profile_qa.train_lora \
  --dataset ml/profile-qa/data/profile_qa.jsonl \
  --adapter-model-id ml/profile-qa/checkpoints/teapot-profile-qa-lora/checkpoint-400 \
  --output-dir ml/profile-qa/checkpoints/teapot-profile-qa-lora-v2 \
  --max-steps 160 \
  --learning-rate 7e-5 \
  --lr-scheduler-type constant_with_warmup
```

If Teapot fails the 1024-token gate, improve the dataset, LoRA settings,
checkpoint, or export/browser packaging. Keep `teapotai/teapotllm`; do not
switch base models.

## Promotion Gate

Do not update the app's browser `MODEL_ID` or default `MODEL_CONTEXT_LIMIT`
until all of these are true:

| Gate | Requirement |
| --- | --- |
| GPU health | `python -m profile_qa.gpu_health` passes on the training host |
| Training | Completed locally on the NVIDIA GPU with the 8GB-safe defaults |
| Loss | Eval loss <= 0.12 and recent training-loss windows <= 0.05 on a split-isolated validation set |
| Context | Promoted model accepts 1024-token prompts without truncating below 1024 |
| Baseline | Eval beats the current Teapot baseline by at least 15% macro score |
| Refusal | Refusal accuracy is at least 95% |
| Multi-turn | Multi-turn follow-up accuracy is at least 80% |
| Browser smoke | Loads and answers a 900-1024 token prompt in Chromium desktop and Mobile Chrome without worker crashes |
| ONNX artifacts | Include `int8` and `uint8` variants with all tensor data embedded and no external sidecars |

## Tests

Tests cover deterministic generation, schemas, split isolation, evidence,
non-refusal privacy, and GPU health. With ML dependencies, offline tiny-T5 tests
compare PyTorch/ONNX encoder and initial/cached decoder outputs, browser cache
names, dynamic shapes, quantization, embedded weights, and lineage:

```bash
PYTHONPATH=ml/profile-qa python -m pytest ml/profile-qa/tests
```

PRs, weekly runs, and manual dispatch run lightweight tests plus locked
environments: the full suite in training and native-export contracts in export.
Neither needs model downloads or GPU training.
