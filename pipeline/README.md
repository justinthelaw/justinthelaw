# Fine-tuning Pipeline

Train a personalized AI model on your resume for browser-based Q&A.

**Time estimate**: ~3-5 hours total on Apple Silicon M3 with 16GB+ RAM

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
- [ ] Set `dataset.hub_id` to `your-username/Your-Dataset`
- [ ] Set `model.hub_id` to `your-username/Your-Model`
- [ ] Set `include_military: false` if not applicable
- [ ] Set `evaluation.hub.model_id` and `evaluation.hub.dataset_id` to your published HuggingFace assets
- [ ] Calibrate `evaluation.thresholds` after baseline eval runs

Edit the `Makefile`:

- [ ] Read and override environment variables, if applicable

Curate evaluation prompts:

- [ ] Update `data/eval/golden.jsonl`
- [ ] Update `data/eval/adversarial.jsonl`
- [ ] Update `data/eval/ood.jsonl`

### 3. Generate Dataset (~1-2 hours)

- [ ] Copy resume: `cp /path/to/resume.pdf resume/resume.pdf`
- [ ] Start llama.cpp server: `make serve`
- [ ] Preview resume extraction: `make preview`
- [ ] Generate data: `make generate-dataset`
- [ ] Stop llama.cpp server: `make stop`

### 4. Fine-Tune and Evaluate Model (~30-60 min)

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

| Command                 | Description                                   | Time      |
| ----------------------- | --------------------------------------------- | --------- |
| `make setup`            | Install dependencies                          | 1 min     |
| `make serve`            | Start llama.cpp LLM server                    | 1-5 min   |
| `make stop`             | Stop llama.cpp LLM server                     | <1 min    |
| `make preview`          | Preview resume data extraction                | <1 min    |
| `make generate-dataset` | Generate training data                        | 1-3 hrs   |
| `make train-model`      | Fine-tune the base model                      | 30-60 min |
| `make test-model`       | Smoke evaluation (alias of `make eval-smoke`) | 2-5 min   |
| `make eval-smoke`       | Deterministic smoke evaluation with gating    | 2-5 min   |
| `make eval-full`        | Full evaluation suite with gating             | 5-20 min  |
| `make eval-compare`     | Full suite and compare against prior report   | 5-20 min  |
| `make push-model`       | Upload model to HuggingFace                   | 1-2 min   |
| `make push-dataset`     | Upload dataset to HuggingFace                 | 1-2 min   |
| `make clean`            | Remove generated files                        | <1 min    |

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
- **Model hallucinating**: Lower `temperature` in `src/config/prompts.ts`
- **ONNX export fails**: Need 16GB+ RAM, close other apps
- **No MPS acceleration**: Ensure PyTorch 2.0+ with `torch.backends.mps.is_available()`
