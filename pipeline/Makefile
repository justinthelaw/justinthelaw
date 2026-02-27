SHELL := /bin/bash
.PHONY: help setup serve stop preview generate-dataset train-model test-model eval-smoke eval-full eval-compare push-model push-dataset clean

# Configuration (override with environment variables)
PORT          ?= 8080
HF_REPO       ?= microsoft/phi-4-gguf
N_GPU_LAYERS  ?= -1
CTX_SIZE      ?= 16384

# Targets

help:
	@echo "Resume Fine-tuning Pipeline"
	@echo ""
	@echo "Dataset Generation:"
	@echo "  make setup            Install dependencies with uv"
	@echo "  make serve            Start llama-server (for dataset generation)"
	@echo "  make stop             Stop llama-server"
	@echo "  make preview          Preview PDF extraction (no LLM calls)"
	@echo "  make generate-dataset Generate SFT dataset from resume"
	@echo ""
	@echo "Training:"
	@echo "  make train-model      Train with SFT+LoRA, merge, and export ONNX"
	@echo ""
	@echo "Testing:"
	@echo "  make test-model       Run smoke evaluation suite (alias of eval-smoke)"
	@echo "  make eval-smoke       Deterministic smoke evaluation with threshold gating"
	@echo "  make eval-full        Full evaluation suite with threshold gating"
	@echo "  make eval-compare     Full suite + compare against COMPARE_TO report dir"
	@echo ""
	@echo "Export & Deploy:"
	@echo "  make push-model       Upload model to HuggingFace Hub"
	@echo "  make push-dataset     Upload dataset to HuggingFace Hub"
	@echo "  make clean            Remove generated files"
	@echo ""
	@echo "Full pipeline:"
	@echo "  make serve && make generate-dataset && make stop && make train-model && make test-model"
	@echo ""
	@echo "Server config:   PORT=$(PORT) HF_REPO=$(HF_REPO)"
	@echo "Push options:    COMMIT_MESSAGE='your message' make push-model"

setup:
	@command -v uv >/dev/null 2>&1 || { echo "Install uv: curl -LsSf https://astral.sh/uv/install.sh | sh"; exit 1; }
	uv sync
	@echo ""
	@echo "Setup complete!"
	@echo "Next steps:"
	@echo "  1. brew install llama.cpp"
	@echo "  2. Place resume at: resume/resume.pdf"
	@echo "  3. make serve"

serve:
	@if [ -f .llama-server.pid ] && ps -p $$(cat .llama-server.pid) >/dev/null 2>&1; then \
		echo "Server already running (PID: $$(cat .llama-server.pid))"; exit 0; \
	fi
	@command -v llama-server >/dev/null 2>&1 || { echo "Install: brew install llama.cpp"; exit 1; }
	@echo "Starting llama-server on port $(PORT)..."
	@echo "Logs: tail -f .llama-server.log"
	@nohup llama-server --port $(PORT) --hf-repo $(HF_REPO) --n-gpu-layers $(N_GPU_LAYERS) --ctx-size $(CTX_SIZE) > .llama-server.log 2>&1 & echo $$! > .llama-server.pid
	@echo "Waiting for llama-server to be ready..."
	@while true; do \
		response=$$(curl -s -w "\n%{http_code}" http://localhost:$(PORT)/health 2>/dev/null); \
		http_code=$$(echo "$$response" | tail -n1); \
		if [ "$$http_code" = "200" ]; then break; fi; \
		echo "  llama-server still loading... (HTTP $$http_code)"; \
		sleep 5; \
	done
	@echo "Server ready!"
	@echo "Next steps:"
	@echo "  1. make preview"

stop:
	@if [ -f .llama-server.pid ]; then \
		kill $$(cat .llama-server.pid) 2>/dev/null || true; \
		rm -f .llama-server.pid; \
		echo "Server stopped."; \
	else \
		echo "No server running."; \
	fi

preview:
	@[ -f resume/resume.pdf ] || { echo "Error: Place resume at resume/resume.pdf"; exit 1; }
	uv run python scripts/generate_dataset.py --preview
	@echo "Next steps:"
	@echo "  1. make generate-dataset"

generate-dataset:
	@[ -f resume/resume.pdf ] || { echo "Error: Place resume at resume/resume.pdf"; exit 1; }
	@curl -s http://localhost:$(PORT)/health >/dev/null || { echo "Error: Start server first with 'make serve'"; exit 1; }
	uv run python scripts/generate_dataset.py
	@echo "Next steps:"
	@echo "  1. make push-dataset"
	@echo "  2. make train-model"

# Single-step training: SFT with LoRA → merge → multi-level ONNX quantization
train-model:
	@[ -d data/sft ] || { echo "Error: Run 'make generate-dataset' first"; exit 1; }
	uv run python scripts/train_model.py
	@echo "Next steps:"
	@echo "  1. make test-model"

test-model:
	@$(MAKE) eval-smoke
	@echo "Next steps:"
	@echo "  1. make eval-full"
	@echo "  2. make push-model"

eval-smoke:
	@[ -d models/onnx ] || { echo "Error: Run 'make train-model' first"; exit 1; }
	@[ -d data/sft ] || { echo "Error: Run 'make generate-dataset' first"; exit 1; }
	uv run python scripts/evaluate_model.py --suite smoke --fail-on-threshold
	@echo "Next steps:"
	@echo "  1. make eval-full"
	@echo "  2. make push-model"

eval-full:
	@[ -d models/onnx ] || { echo "Error: Run 'make train-model' first"; exit 1; }
	@[ -d data/sft ] || { echo "Error: Run 'make generate-dataset' first"; exit 1; }
	uv run python scripts/evaluate_model.py --suite full --fail-on-threshold
	@echo "Next steps:"
	@echo "  1. make push-model"

eval-compare:
	@[ -d models/onnx ] || { echo "Error: Run 'make train-model' first"; exit 1; }
	@[ -d data/sft ] || { echo "Error: Run 'make generate-dataset' first"; exit 1; }
	@[ -n "$(COMPARE_TO)" ] || { echo "Error: Usage -> make eval-compare COMPARE_TO=data/eval_reports/<timestamp>"; exit 1; }
	uv run python scripts/evaluate_model.py --suite full --fail-on-threshold --compare-to $(COMPARE_TO)
	@echo "Next steps:"
	@echo "  1. make push-model"

push-model:
	@[ -d models/onnx ] || { echo "Error: Run 'make train-model' first"; exit 1; }
	@echo "Login first: huggingface-cli login"
	uv run python scripts/push_hub.py model $(if $(COMMIT_MESSAGE),-m "$(COMMIT_MESSAGE)")

push-dataset:
	@[ -d data ] || { echo "Error: Run 'make generate-dataset' first"; exit 1; }
	@echo "Login first: huggingface-cli login"
	uv run python scripts/push_hub.py dataset $(if $(COMMIT_MESSAGE),-m "$(COMMIT_MESSAGE)")

clean: stop
	rm -rf .venv/ data/* models/* resume/* .llama-server.pid .llama-server.log
	@echo "Cleaned all temporary files."
