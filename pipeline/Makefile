SHELL := /bin/bash
.PHONY: help setup serve stop preview generate train train-sft train-dpo merge test-model test-onnx push-model push-dataset clean

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
	@echo "  make setup        Install dependencies with uv"
	@echo "  make serve        Start llama-server (for dataset generation)"
	@echo "  make stop         Stop llama-server"
	@echo "  make preview      Preview PDF extraction (no LLM calls)"
	@echo "  make generate     Generate SFT and DPO datasets from resume"
	@echo ""
	@echo "Training:"
	@echo "  make train        Run full training pipeline (SFT + DPO)"
	@echo "  make train-sft    Train with SFT for factual memorization"
	@echo "  make train-dpo    Train with DPO for preference alignment"
	@echo ""
	@echo "Testing:"
	@echo "  make test-model   Test merged model with random question (fast)"
	@echo "  make test-onnx    Test ONNX model with random question (slow)"
	@echo ""
	@echo "Export & Deploy:"
	@echo "  make merge        Merge LoRA into base model + export to ONNX"
	@echo "  make push-model   Upload model to HuggingFace Hub"
	@echo "  make push-dataset Upload dataset to HuggingFace Hub"
	@echo "  make clean        Remove generated files"
	@echo ""
	@echo "Full pipeline:"
	@echo "  make serve && make generate && make stop && make train && make merge"
	@echo ""
	@echo "Server config:   PORT=$(PORT) HF_REPO=$(HF_REPO)"
	@echo "Push options:    COMMIT_MESSAGE='your message' make push-model"

setup:
	@command -v uv >/dev/null 2>&1 || { echo "Install uv: curl -LsSf https://astral.sh/uv/install.sh | sh"; exit 1; }
	uv sync
	@echo ""
	@echo "Setup complete!"
	@echo "Prerequisites:"
	@echo "  1. brew install llama.cpp"
	@echo "  2. Place resume at: resume/resume.pdf"

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

generate:
	@[ -f resume/resume.pdf ] || { echo "Error: Place resume at resume/resume.pdf"; exit 1; }
	@curl -s http://localhost:$(PORT)/health >/dev/null || { echo "Error: Start server first with 'make serve'"; exit 1; }
	uv run python scripts/generate_dataset.py

# Stage 1+2: SFT teaches facts, DPO teaches preferences (correct > hallucinated)
train: train-sft train-dpo

# Stage 1: Supervised Fine-Tuning - memorize resume facts
train-sft:
	@[ -d data/sft ] || { echo "Error: Run 'make generate' first"; exit 1; }
	uv run python scripts/train_sft.py

# Stage 2: Direct Preference Optimization - prefer grounded answers
train-dpo:
	@[ -d data/dpo ] || [ -d data ] || { echo "Error: Run 'make generate' first"; exit 1; }
	@[ -d models/lora ] || { echo "Error: Run 'make train-sft' first"; exit 1; }
	uv run python scripts/train_lora.py

# Export: Merge LoRA weights + convert to ONNX for browser inference
merge:
	@[ -d models/lora ] || { echo "Error: Run 'make train' first"; exit 1; }
	uv run python scripts/merge_lora.py

test-model:
	@[ -d models/merged ] || { echo "Error: Run 'make merge' first"; exit 1; }
	@[ -d data/dpo ] || { echo "Error: Run 'make generate' first"; exit 1; }
	uv run python scripts/test_model.py --format pytorch

test-onnx:
	@[ -d models/onnx ] || { echo "Error: Run 'make merge' first"; exit 1; }
	@[ -d data/dpo ] || { echo "Error: Run 'make generate' first"; exit 1; }
	uv run python scripts/test_model.py --format onnx

push-model:
	@[ -d models/onnx ] || { echo "Error: Run 'make merge' first"; exit 1; }
	@echo "Login first: huggingface-cli login"
	uv run python scripts/push_hub.py model $(if $(COMMIT_MESSAGE),-m "$(COMMIT_MESSAGE)")

push-dataset:
	@[ -d data ] || { echo "Error: Run 'make generate' first"; exit 1; }
	@echo "Login first: huggingface-cli login"
	uv run python scripts/push_hub.py dataset $(if $(COMMIT_MESSAGE),-m "$(COMMIT_MESSAGE)")

clean: stop
	rm -rf .venv/ data/* models/* resume/* .llama-server.pid .llama-server.log
	@echo "Cleaned all temporary files."
