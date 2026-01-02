# Fine-tuning Pipeline

Train a personalized AI model on your resume for browser-based Q&A.

**Time estimate**: ~2-4 hours total on Apple Silicon M1/M2 with 16GB+ RAM

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

Edit the `Makefile`:

- [ ] Read and override environment variables, if applicable

### 3. Generate Dataset (~1-2 hours)

- [ ] Copy resume: `cp /path/to/resume.pdf resume/resume.pdf`
- [ ] Start server: `make serve`
- [ ] Generate data: `make generate`
- [ ] Stop server: `make stop`

### 4. Train Model (~30-60 min)

- [ ] Run training: `make train` (SFT + DPO)

### 5. Export to ONNX (~5 min)

- [ ] Merge and export: `make merge`
- [ ] Test merged model: `make test-model`
- [ ] Test ONNX model: `make test-onnx`

### 6. Push to HuggingFace (~2 min)

- [ ] Login: `huggingface-cli login`
- [ ] Upload model: `make push-model`
- [ ] Upload dataset (optional): `make push-dataset`

### 7. Update Website (~5 min)

- [ ] Edit `src/config/models.ts` with your model ID
- [ ] Test: `npm run flight-check`
- [ ] Deploy: `npm run deploy`

## One-liner

```bash
make serve && make generate && make stop && make train && make merge
```

## Commands

| Command             | Description                       | Time      |
| ------------------- | --------------------------------- | --------- |
| `make setup`        | Install dependencies              | 1 min     |
| `make serve`        | Start LLM server                  | 1-5 min   |
| `make generate`     | Generate training data            | 1-3 hrs   |
| `make train`        | Train model (SFT + DPO)           | 30-60 min |
| `make merge`        | Export to ONNX                    | 5 min     |
| `make test-model`   | Test merged model (PyTorch, fast) | 1 min     |
| `make test-onnx`    | Test ONNX model (browser sim)     | 1-2 min   |
| `make push-model`   | Upload model to HuggingFace       | 1-2 min   |
| `make push-dataset` | Upload dataset to HuggingFace     | 1-2 min   |
| `make clean`        | Remove generated files            | <1 min    |

## Tuning for Better Results

| Setting                | Default | Increase for better memorization |
| ---------------------- | ------- | -------------------------------- |
| `samples_per_category` | 1000    | 5000+                            |
| `sft.epochs`           | 8       | 15+                              |
| `lora.r`               | 64      | 64+                              |

## Troubleshooting

- **Model not accurate**: Increase `samples_per_category` and `sft.epochs`
- **Model hallucinating**: Lower `temperature` in `src/config/prompts.ts`
- **ONNX export fails**: Need 16GB+ RAM, close other apps
- **No MPS acceleration**: Ensure PyTorch 2.0+ with `torch.backends.mps.is_available()`

## Directory Structure

```text
pipeline/
├── config.yaml     # Configuration
├── Makefile        # Orchestration
├── resume/         # Your resume.pdf
├── data/           # Generated datasets (sft/, dpo/)
├── models/         # Trained models (lora/, merged/, onnx/)
└── scripts/        # Python scripts
```
