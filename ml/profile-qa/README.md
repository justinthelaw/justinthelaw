# Local NVIDIA Profile-QA Pipeline

This directory contains the local-only training and promotion pipeline for a
browser profile Q&A model targeting a 1024-token prompt budget. Generated data,
checkpoints, merged weights, ONNX exports, and reports are ignored by git.

For the end-to-end app and promotion handoff, see
[docs/DIAGRAMS.md](../../docs/DIAGRAMS.md).

The profile ontology is intentionally generic for fork reuse: section IDs should
stay in resume categories such as `identity`, `current_role`, `experience`,
`projects`, `education`, `recommendations`, `skills`, and `interests`. Keep
that order temporal and practical: experience outranks education, and
recommendations sit just below education but above hobbies/interests or
personality-trait sections. Put person-specific names, employers, schools, and
projects in fact text and keywords.

The single checked-in profile source is `src/config/public-profile.json`.
`src/config/site.ts` imports it for browser retrieval, and
`profile_qa/public_profile.py` loads the same file for dataset generation. Keep
browser section priorities and retrieval keywords alongside each fact's
deterministic evaluation `terms`; do not copy facts into either consumer.
The identity section's `subject` metadata drives both browser prompt identity
and the names and pronouns rendered into training prompts. Fact-specific
question and history wording is centralized in `profile_qa/synthetic_data.py`;
update its matching QA entry when a customized fact makes an employer, school,
product, or role reference inaccurate.
Every grouped QA entry must select a named `termGroup` for each evidence fact.
Use the minimum terms that every question variant requires for a complete
answer; dataset generation rejects missing selectors and broad
`all_evidence_terms` scoring.

## Prerequisites

| Need | Detail |
| --- | --- |
| NVIDIA access | Run from a host shell with visible `/dev/nvidia*` devices or a container with NVIDIA device passthrough |
| CUDA | CUDA-enabled PyTorch wheels are sufficient for v1; `nvcc` is optional unless a dependency needs CUDA extension compilation |
| Python | Python 3.14.7 is pinned in the repository `.python-version` |
| Python dependencies | Install with the commands below |

```bash
uv python install
uv venv ml/profile-qa/.venv
uv pip sync --python ml/profile-qa/.venv --require-hashes ml/profile-qa/requirements.lock
uv venv ml/profile-qa/.venv-export
uv pip sync --python ml/profile-qa/.venv-export --require-hashes \
  ml/profile-qa/requirements-export.lock
. ml/profile-qa/.venv/bin/activate
```

After changing either requirements manifest, refresh its reproducible Python
3.14 hash lock with the CI-pinned uv version in `.github/workflows/ml.test.yml`:

```bash
uv pip compile --python-version 3.14 --generate-hashes \
  --output-file ml/profile-qa/requirements.lock \
  ml/profile-qa/requirements.txt
uv pip compile --python-version 3.14 --generate-hashes \
  --output-file ml/profile-qa/requirements-export.lock \
  ml/profile-qa/requirements-export.txt
```

Training and export both use current Transformers 5 and Hub 1 releases. The
smaller export environment uses native PyTorch ONNX export and ONNX Runtime,
without Optimum. Export only the verified local merged model from this pipeline.
CI checks manifest-to-lock consistency, recreates both environments with hashes,
and audits both dependency graphs without vulnerability exceptions.

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

The training, continuation, merge, and export commands are Teapot-only. Training
always starts from `teapotai/teapotllm` and persists the pinned base revision in
every PEFT checkpoint and final adapter. Continuation, resume, evaluation,
generation, merge, and packaging reject adapters whose PEFT metadata omits that
revision or names a different base model or revision. Export expects the merged
model directory produced by `profile_qa.merge_adapter`. The native exporter in
`profile_qa/native_t5_onnx.py` creates `encoder_model.onnx` and
`decoder_model_merged.onnx` with dynamic shapes and initial/cached decoding for
the T5 browser runtime. Artifact preparation
labels the model card with `pipeline_tag: text2text-generation`, matching the
Transformers.js task used by the deployed browser worker.

Evaluation reports record the canonical published-dataset SHA-256, exact
formatted-prompt digest, split, pinned base revision, local adapter or
merged-model digest, generation settings and implementation digest, and a schema
plus normalized-token digest of the scoring implementation. Artifact preparation
recomputes every published metric from the report's saved per-record predictions
with that current scorer. Merge records the pinned revision plus adapter and
merged-model SHA-256 values; export verifies those values and carries the lineage
plus a content digest through the full-precision, quantized, and browser artifact
stages. Each quantized marker also names the exact full-precision artifact digest
it consumed. Published artifact markers derive their source-lineage digest from
the sanitized public projection, so the private local checkpoint path neither
leaves the merge workspace nor influences that digest. Artifact preparation
accepts only the exact publishable report-provenance schema; its validation and
test reports must identify the same adapter or merged representation, and their
canonical dataset, live prompt context, base revision, checkpoint label, and
model digests must match the selected inputs. The browser marker must also match
the actual browser files.

Before either payload directory is replaced, preparation verifies that promoted
test macro improves on the baseline by at least 15%, and that promoted validation
and test reports both meet the 95% refusal and 80% multi-turn thresholds. It also
rejects an output path that overlaps the dataset, reports, lineage, browser
artifact, or selected adapter checkpoint, so validation never deletes its own
release inputs.

The merge output must be disjoint from the selected adapter checkpoint. The
merge command rejects equal, ancestor, descendant, and symlinked output paths,
then replaces a valid disjoint output tree so stale files cannot enter its
content digest.

The export `--skip-export` and `--skip-quantize` recovery flags only reuse stage
directories whose lineage marker and content digest still validate. Quantized
directories from a prior full-precision export are rejected even when both
exports share the same merged-model lineage. Regenerate legacy or modified
export directories instead of relabeling them.

Artifact preparation derives the promoted checkpoint from that verified lineage
and reads its latest train loss and best validation eval loss from the
checkpoint's `trainer_state.json`. Model-card LoRA rank, alpha, dropout, and
target modules come from the digest-validated `adapter_config.json`; hardware,
optimizer, training quantization, and batch-size claims are omitted because the
checkpoint does not preserve trustworthy values for them. Pass the intended
release date explicitly in ISO `YYYY-MM-DD` format. Missing, mismatched, stale,
or malformed provenance stops preparation before an existing model payload is
replaced. To reuse generated
outputs, first write a provenance-bound bundle with `--save-predictions-json`.
`--predictions-json` accepts only that bundle format and verifies its model,
canonical dataset, split, formatted prompts, and exact record IDs before
scoring; generation settings and implementation must also match, so plain or
stale prediction mappings are rejected. Per-module rank or alpha patterns,
DoRA/RS-LoRA, trained bias values, and saved extra modules fail closed rather
than being flattened into an inaccurate simple-LoRA model-card claim.

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

If Teapot cannot pass the 1024-token promotion gate, keep the lineage on
`teapotai/teapotllm` and fix the Teapot path directly: improve the public-profile
dataset, adjust LoRA hyperparameters, continue from a stronger adapter checkpoint,
or repair export/browser packaging issues. Do not switch base models.

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
| ONNX artifacts | Include `int8` and `uint8` variants and no `.onnx.data` files |

## Tests

The Python tests cover deterministic generation, schema validation, split
isolation, evidence references, no private-data leakage in non-refusal examples,
and GPU health-check behavior. With ML dependencies installed, offline tiny T5
tests also compare encoder and initial/cached decoder outputs with PyTorch,
verify browser cache names and dynamic shapes, and exercise quantization,
embedded weights, and artifact lineage:

```bash
PYTHONPATH=ml/profile-qa python -m pytest ml/profile-qa/tests
```

Pull requests, the weekly schedule, and manual workflow dispatch run the
lightweight suite and locked training/export checks. The training environment
runs the full suite; the exporter environment runs the native export contract
tests. Neither requires a model download or GPU training run.
