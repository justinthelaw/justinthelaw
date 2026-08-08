# Local NVIDIA Profile-QA Pipeline

This directory contains the local-only training and promotion pipeline for a
browser profile Q&A model targeting a 1024-token prompt budget. Generated data,
checkpoints, merged weights, ONNX exports, and reports are ignored by git.

For the end-to-end app and promotion handoff, see
[docs/diagrams.md](../../docs/diagrams.md).

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
| Python | Python 3.14.6 is pinned in the repository `.python-version` |
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

After changing `requirements.txt`, refresh the reproducible Python 3.14 lock:

```bash
uv pip compile --python-version 3.14 --generate-hashes \
  --output-file ml/profile-qa/requirements.lock \
  ml/profile-qa/requirements.txt
uv pip compile --python-version 3.14 --generate-hashes \
  --output-file ml/profile-qa/requirements-export.lock \
  ml/profile-qa/requirements-export.txt
```

The main training/evaluation environment uses current Transformers 5 and Hub 1
releases. ONNX export is isolated because Optimum ONNX 0.1 currently requires
Optimum 2.1.x, Transformers 4.57.x, and Hub 0.x. Only use the export environment
with the trusted local merged model produced by this pipeline; do not use it to
load arbitrary model repositories or checkpoints. The exporter remains on
Transformers 4.57.x because the current Optimum ONNX stack is incompatible with
the patched Transformers 5.x releases. CI therefore records explicit
`pip-audit` exceptions for the known Transformers advisories; treat the export
environment as trusted-local-only and revisit those exceptions when the
exporter supports Transformers 5.

## Commands

```bash
PYTHONPATH=ml/profile-qa python -m profile_qa.gpu_health
PYTHONPATH=ml/profile-qa python -m profile_qa.synthetic_data --output ml/profile-qa/data/profile_qa.jsonl
PYTHONPATH=ml/profile-qa python -m profile_qa.train_lora --dataset ml/profile-qa/data/profile_qa.jsonl
PYTHONPATH=ml/profile-qa python -m profile_qa.evaluate --dataset ml/profile-qa/data/profile_qa.jsonl --model-id teapotai/teapotllm
PYTHONPATH=ml/profile-qa python -m profile_qa.merge_adapter --adapter-model-id ml/profile-qa/checkpoints/teapot-profile-qa-lora/checkpoint-400 --output-dir ml/profile-qa/merged/teapot-profile-qa
PYTHONPATH=ml/profile-qa ml/profile-qa/.venv-export/bin/python -m profile_qa.export_onnx --output-dir ml/profile-qa/onnx/candidate
PYTHONPATH=ml/profile-qa python -m profile_qa.prepare_hf_artifacts --model-browser-dir ml/profile-qa/onnx/candidate/browser
PYTHONPATH=ml/profile-qa python -m profile_qa.publish --repo-id justinthelaw/teapot-profile-qa-browser-1024 --artifact-dir ml/profile-qa/hf/model
PYTHONPATH=ml/profile-qa python -m profile_qa.publish --repo-type dataset --repo-id justinthelaw/profile-qa-synthetic-public-v1 --artifact-dir ml/profile-qa/hf/dataset
```

The training, continuation, merge, and export commands are Teapot-only. Training
always starts from `teapotai/teapotllm`; adapter continuation and merge reject
checkpoints whose PEFT metadata records a different base model; export expects
the merged model directory produced by `profile_qa.merge_adapter` and publishes
the encoder plus merged decoder ONNX files for the T5 browser runtime.

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
and GPU health-check behavior:

```bash
PYTHONPATH=ml/profile-qa python -m pytest ml/profile-qa/tests
```

Pull requests run this lightweight suite. A scheduled and manually dispatchable
workflow also recreates the complete locked ML environment and smoke-tests every
direct dependency without requiring a GPU training run.
