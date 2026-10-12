# LLM Pipeline Instructions

Local NVIDIA training and promotion for the browser's 1024-token Profile-QA
model. See [root instructions](../AGENTS.md) and [system flow](../docs/DIAGRAMS.md).
Generated datasets, checkpoints, weights, ONNX files, and reports stay ignored.

## Scope and Inputs

- Run commands from the repository root with the `llm.persona` package;
  use `PYTHONPATH=.` if needed. Keep the package namespaced and its directory
  named `persona` so Python's standard `profile` module remains available.
- Keep existing artifact names (`profile_qa*.jsonl`, reports, lineage markers),
  provenance schemas, and Hugging Face IDs stable; they identify releases,
  independently of the Python package name.
- Facts live only in `src/config/public-profile.json`, shared with the browser.
  Keep generic section IDs ordered identity, current_role, experience, projects,
  education, recommendations, skills, interests. Names/employers belong in facts
  and keywords; keep browser priorities/keywords aligned with evaluation terms.
- `identity.subject` supplies names and pronouns. Update `persona/synthetic_data.py`
  templates when changed facts invalidate employer, school, product, or role
  references. Every grouped QA entry selects a named `termGroup` per evidence
  fact with minimum terms required by every variant. Missing selectors and broad
  `all_evidence_terms` scoring are rejected.

## Environments and Checks

Use repository-pinned Python (`.python-version`) and uv
(`.github/workflows/llm.test.yml`). Training requires visible NVIDIA devices or
container passthrough; CUDA-enabled PyTorch wheels suffice without `nvcc` unless
a dependency compiles CUDA extensions. The smaller export environment uses
native `torch.export` and ONNX Runtime, without Optimum.

```bash
uv python install
uv venv llm/.venv
uv pip sync --python llm/.venv --require-hashes llm/requirements.lock
uv venv llm/.venv-export
uv pip sync --python llm/.venv-export --require-hashes llm/requirements-export.lock
. llm/.venv/bin/activate
python -m pytest llm/tests
```

After manifest changes, regenerate and commit both relevant hash locks:

```bash
uv pip compile --python-version 3.14 --generate-hashes \
  --output-file llm/requirements.lock llm/requirements.txt
uv pip compile --python-version 3.14 --generate-hashes \
  --output-file llm/requirements-export.lock llm/requirements-export.txt
```

Keep Accelerate >=1.15 to exclude PYSEC-2026-3804. CI checks lock consistency,
recreates/audits both dependency graphs without exceptions, runs the full suite
in training and native-export contracts in export. Lightweight tests cover data,
schemas, splits, evidence, privacy, GPU checks, and lineage. Offline tiny-T5 tests
verify numerical outputs, initial/cached decoding, dynamic shapes, cache names,
quantization, and embedded weights; no downloaded model or GPU training is needed.

## Pipeline Commands

```bash
python -m llm.persona.gpu_health
python -m llm.persona.synthetic_data --output llm/data/profile_qa.jsonl
python -m llm.persona.train_lora --dataset llm/data/profile_qa.jsonl
python -m llm.persona.evaluate \
  --dataset llm/data/profile_qa.jsonl --model-id teapotai/teapotllm \
  --split test --output llm/reports/profile_qa_eval_baseline_test.json
python -m llm.persona.evaluate \
  --dataset llm/data/profile_qa.jsonl \
  --model-id llm/checkpoints/teapot-profile-qa-lora/checkpoint-400 \
  --split validation --output llm/reports/profile_qa_eval_candidate_validation.json
python -m llm.persona.evaluate \
  --dataset llm/data/profile_qa.jsonl \
  --model-id llm/checkpoints/teapot-profile-qa-lora/checkpoint-400 \
  --split test --output llm/reports/profile_qa_eval_candidate_test.json
python -m llm.persona.merge_adapter \
  --adapter-model-id llm/checkpoints/teapot-profile-qa-lora/checkpoint-400 \
  --output-dir llm/merged/teapot-profile-qa
llm/.venv-export/bin/python -m llm.persona.export_onnx --output-dir llm/onnx/candidate
python -m llm.persona.prepare_hf_artifacts \
  --model-browser-dir llm/onnx/candidate/browser \
  --lineage-file llm/merged/teapot-profile-qa/teapot_profile_qa_lineage.json \
  --release-date YYYY-MM-DD
```

For targeted continuation, pass `--adapter-model-id` to `llm.persona.train_lora`
with a disjoint `--output-dir`; an example continuation uses `--max-steps 160`,
`--learning-rate 7e-5`, and `--lr-scheduler-type constant_with_warmup`.
Publishing requires explicit authorization; then use:

```bash
python -m llm.persona.publish --repo-id justinthelaw/teapot-profile-qa-browser-1024 \
  --artifact-dir llm/hf/model
python -m llm.persona.publish --repo-type dataset \
  --repo-id justinthelaw/profile-qa-synthetic-public-v1 --artifact-dir llm/hf/dataset
```

## Artifact Safeguards

- Use only `teapotai/teapotllm` and its pinned revision. Every PEFT checkpoint and
  final adapter records that base; continuation, resume, evaluation, generation,
  merge, and packaging reject missing or different metadata. Improve data, LoRA,
  checkpoints, or packaging if the context gate fails; do not switch base models.
- Merge output must be disjoint from input, including symlink resolutions;
  replace valid output trees to exclude stale files. Export only verified local
  merged weights. `persona/native_t5_onnx.py` produces `encoder_model.onnx` and
  `decoder_model_merged.onnx`; cards use `pipeline_tag: text2text-generation`.
- Reports bind canonical dataset SHA-256, exact formatted prompts, split, base
  revision, model digest, generation settings/implementation, and scoring
  schema/normalized-token digest. Packaging recomputes metrics from saved
  predictions with the current scorer. Prediction bundles require exact model,
  dataset, split, IDs, prompts, settings, and implementation; stale/plain mappings
  fail. Use `--save-predictions-json` and verified `--predictions-json` for reuse.
- Merge records revision and adapter/model hashes. Export verifies lineage and
  contents at FP, quantized, and browser stages; quantization binds its exact FP
  input digest. Public lineage uses portable labels and excludes private paths
  from payloads and digests. Browser markers must match actual files.
- Packaging requires publishable provenance. Validation/test reports identify
  the same adapter or merged representation and match the dataset, live prompts,
  revision, checkpoint label, and model digests. Output cannot overlap datasets,
  reports, lineage, browser artifacts, or the selected checkpoint.
- Recovery with `--skip-export`/`--skip-quantize` requires valid stage lineage and
  digests; reject quantized outputs from another FP export even with identical
  merged lineage. Regenerate stale/legacy files instead of relabeling them.
- Derive latest train/best validation loss from the lineage-selected checkpoint's
  `trainer_state.json` and LoRA settings from digest-validated `adapter_config.json`.
  Omit unverified hardware, optimizer, quantization, and batch-size claims.
  Per-module rank/alpha, DoRA/RS-LoRA, trained bias, and extra saved modules fail
  closed. Require ISO `--release-date YYYY-MM-DD`; invalid or stale provenance
  stops preparation before payload replacement.

## Promotion Gate

Do not change browser `MODEL_ID` or default `MODEL_CONTEXT_LIMIT` until every gate
passes. Packaging checks metric gates before replacing either payload.

| Gate | Requirement |
| --- | --- |
| GPU/training | GPU health passes; local NVIDIA training finishes with 8GB-safe defaults |
| Loss | Eval loss <=0.12; recent training-loss windows <=0.05; split-isolated validation |
| Context | Accepts 1024-token prompts without truncating below 1024 |
| Baseline | Test macro score improves >=15% over the current Teapot baseline |
| Refusal | >=95% on validation and test |
| Multi-turn | >=80% on validation and test |
| Browser | 900-1024 token smoke in desktop Chromium and Mobile Chrome; no worker crash |
| ONNX | Both int8/uint8 variants; all tensor data embedded, no external sidecars |
