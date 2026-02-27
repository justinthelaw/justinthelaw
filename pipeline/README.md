# Fine-tuning Pipeline

Train a personalized AI model on your resume for browser-based Q&A.

**Time estimate**: ~12-24 hours total on Apple Silicon M3 with 36GB+ RAM

## Config Tuning Reference

For per-knob rationale and tuning guidance, see [`HYPERPARAMETER.md`](./HYPERPARAMETER.md).

## Prerequisites

- [ ] macOS (Apple Silicon with MPS acceleration) or Linux with 16GB+ RAM
- [ ] Python 3.10+ with [uv](https://astral.sh/uv): `curl -LsSf https://astral.sh/uv/install.sh | sh`
- [ ] [llama.cpp](https://github.com/ggerganov/llama.cpp): `brew install llama.cpp`
- [ ] [HuggingFace account](https://huggingface.co/join) with write token

## Pipeline Checklist

### 1. Setup (~2 min)

- [ ] `cd pipeline`
- [ ] `make setup`

### 2. Configure (~5 min)

Edit `config.yaml`:

- [ ] Set `person_name` and `person_full_name`
- [ ] Confirm `model.base` is `Qwen/Qwen2.5-0.5B-Instruct`
- [ ] Set `dataset.hub_id` to `your-username/Your-Dataset`
- [ ] Set `model.hub_id` to a new Qwen repo (do not reuse legacy SmolLM2 repo IDs)
- [ ] Keep balanced runtime defaults for first pass: `dataset.samples_per_category=1200`, `sft.epochs=8`, `sft.eval_strategy="no"`
- [ ] Set `include_military: false` if not applicable
- [ ] Set `has_recommendations: false` if you do not want recommendation-focused questions
- [ ] Set `evaluation.hub.model_id` and `evaluation.hub.dataset_id` to your published HuggingFace assets
- [ ] Calibrate `evaluation.thresholds` after baseline eval runs

Edit the `Makefile`:

- [ ] Read and override environment variables, if applicable

Curate evaluation prompts:

- [ ] Update `data/eval/golden.jsonl`
- [ ] Update `data/eval/adversarial.jsonl`
- [ ] Update `data/eval/ood.jsonl`

### 3. Generate Dataset (~45-90 mins)

- [ ] Copy resume: `cp /path/to/resume.pdf resume/resume.pdf`
- [ ] Start llama.cpp server: `make serve`
- [ ] Preview resume extraction: `make preview`
- [ ] Generate data: `make generate-dataset`
- [ ] Stop llama.cpp server: `make stop`

### 4. Fine-Tune and Evaluate Model (~12-24 hours)

- [ ] Run fine-tuning: `make train-model`
- [ ] Run smoke evaluation: `make test-model`
- [ ] Run full evaluation (recommended before publishing): `make eval-full`

### 5. Push to HuggingFace (~2 min)

- [ ] Login: `huggingface-cli login`
- [ ] Upload model: `make push-model`
- [ ] Upload dataset (optional): `make push-dataset`

### 6. Update Website (~5 min)

- [ ] Edit `src/config/models.ts` with your model ID
- [ ] Test: `npm run flight-check`
- [ ] Deploy: `npm run deploy`

## One-liner

```bash
make serve && make generate-dataset && make stop && make train-model && make eval-full
```

## Commands

| Command                 | Description                                   | Time       |
| ----------------------- | --------------------------------------------- | ---------- |
| `make setup`            | Install dependencies                          | 1 min      |
| `make serve`            | Start llama.cpp LLM server                    | 1-5 min    |
| `make stop`             | Stop llama.cpp LLM server                     | <1 min     |
| `make preview`          | Preview resume data extraction                | <1 min     |
| `make generate-dataset` | Generate training data                        | 45-120 min |
| `make train-model`      | Fine-tune the base model                      | 20-45 min  |
| `make test-model`       | Smoke evaluation (alias of `make eval-smoke`) | 2-5 min    |
| `make eval-smoke`       | Deterministic smoke evaluation with gating    | 2-5 min    |
| `make eval-full`        | Full evaluation suite with gating             | 5-20 min   |
| `make eval-compare`     | Full suite and compare against prior report   | 5-20 min   |
| `make push-model`       | Upload model to HuggingFace                   | 1-2 min    |
| `make push-dataset`     | Upload dataset to HuggingFace                 | 1-2 min    |
| `make clean`            | Remove generated files                        | <1 min     |

## Evaluation Suite

The evaluation suite lives in `scripts/evaluate_model.py` and produces deterministic reports under `data/eval_reports/<timestamp>/`.

Report artifacts:

- `summary.md` - human-readable scorecard and threshold status
- `metrics.json` - machine-readable aggregate metrics
- `failures.jsonl` - failing cases with model output and reasons
- `config_snapshot.json` - resolved evaluation config used for that run

Curated eval sets:

- `data/eval/golden.jsonl` - factual recall prompts
- `data/eval/adversarial.jsonl` - robustness and prompt-injection checks
- `data/eval/ood.jsonl` - out-of-domain refusal checks

Example commands:

```bash
# Smoke suite with threshold gating
make eval-smoke

# Full suite with threshold gating
make eval-full

# Compare current run to a previous report
make eval-compare COMPARE_TO=data/eval_reports/2026-02-27T103000Z
```

CI:

- PRs that touch `pipeline/**` run `.github/workflows/pipeline.test.yml` for Ruff + Pyright.

## Troubleshooting

Please review the Python-based CLI tools that the Make targets run for details on more complex use cases (e.g., run the quantization step only).

- **Model not accurate**: Increase `samples_per_category` and `sft.epochs`
- **Pipeline too slow**: Keep the default balanced profile (`samples_per_category: 1200`, `sft.epochs: 8`, `sft.eval_strategy: "no"`). For higher quality runs, increase `samples_per_category` and `sft.epochs` after a baseline pass.
- **Model hallucinating**: Lower `temperature` in `src/config/prompts.ts`
- **ONNX export fails**: Need 16GB+ RAM, close other apps
- **No MPS acceleration**: Ensure PyTorch 2.0+ with `torch.backends.mps.is_available()`
