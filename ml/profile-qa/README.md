# Local NVIDIA Profile-QA Pipeline

This directory contains the local-only training and promotion pipeline for a
browser profile Q&A model targeting a 1024-token prompt budget. Generated data,
checkpoints, merged weights, ONNX exports, and reports are ignored by git.

The profile ontology is intentionally generic for fork reuse: section IDs should
stay in resume categories such as `identity`, `current_role`, `experience`,
`projects`, `education`, `recommendations`, `skills`, and `interests`. Keep
that order temporal and practical: experience outranks education, and
recommendations sit just below education but above hobbies/interests or
personality-trait sections. Put person-specific names, employers, schools, and
projects in fact text and keywords.

## Prerequisites

- Run from a normal host shell with visible `/dev/nvidia*` devices, or from a
  container launched with NVIDIA device passthrough.
- CUDA-enabled PyTorch wheels are sufficient for v1; `nvcc` is optional unless a
  dependency needs CUDA extension compilation.
- Install Python dependencies:

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r ml/profile-qa/requirements.txt
```

## Commands

```bash
python -m profile_qa.gpu_health
python -m profile_qa.synthetic_data --output ml/profile-qa/data/profile_qa.jsonl
python -m profile_qa.train_lora --dataset ml/profile-qa/data/profile_qa.jsonl
python -m profile_qa.evaluate --dataset ml/profile-qa/data/profile_qa.jsonl --model-id teapotai/teapotllm
python -m profile_qa.merge_adapter --adapter-model-id ml/profile-qa/checkpoints/teapot-profile-qa-lora/checkpoint-400 --output-dir ml/profile-qa/merged/teapot-profile-qa
python -m profile_qa.export_onnx --model ml/profile-qa/merged/teapot-profile-qa --output-dir ml/profile-qa/onnx/candidate
python -m profile_qa.prepare_hf_artifacts --model-browser-dir ml/profile-qa/onnx/candidate/browser
python -m profile_qa.publish --repo-id justinthelaw/teapot-profile-qa-browser-1024 --artifact-dir ml/profile-qa/hf/model
python -m profile_qa.publish --repo-type dataset --repo-id justinthelaw/profile-qa-synthetic-public-v1 --artifact-dir ml/profile-qa/hf/dataset
```

For targeted continuation from an existing LoRA adapter:

```bash
python -m profile_qa.train_lora \
  --dataset ml/profile-qa/data/profile_qa.jsonl \
  --adapter-model-id ml/profile-qa/checkpoints/teapot-profile-qa-lora/checkpoint-400 \
  --output-dir ml/profile-qa/checkpoints/teapot-profile-qa-lora-v2 \
  --max-steps 160 \
  --learning-rate 7e-5 \
  --lr-scheduler-type constant_with_warmup
```

If Teapot cannot pass the 1024-token promotion gate, keep the same pipeline and
rerun training with:

```bash
python -m profile_qa.train_lora --model-id Qwen/Qwen2.5-0.5B-Instruct
```

## Promotion Gate

Do not update the app's browser `MODEL_ID` or default `MODEL_CONTEXT_LIMIT`
until all of these are true:

- `python -m profile_qa.gpu_health` passes on the training host.
- Training completed locally on the NVIDIA GPU with the 8GB-safe defaults.
- Loss targets are met on a split-isolated validation set: eval loss <= 0.12
  and recent training-loss windows <= 0.05.
- The promoted model accepts 1024-token prompts without truncating below 1024.
- Eval beats the current Teapot baseline by at least 15% macro score.
- Refusal accuracy is at least 95%.
- Multi-turn follow-up accuracy is at least 80%.
- Browser smoke loads and answers a 900-1024 token prompt in Chromium desktop
  and Mobile Chrome without worker crashes.
- ONNX artifacts include `int8` and `uint8` variants and no `.onnx.data` files.

## Tests

The Python tests cover deterministic generation, schema validation, split
isolation, evidence references, no private-data leakage in non-refusal examples,
and GPU health-check behavior:

```bash
PYTHONPATH=ml/profile-qa python -m pytest ml/profile-qa/tests
```
