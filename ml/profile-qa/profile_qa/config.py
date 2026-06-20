"""Configuration for the local profile-QA pipeline."""

from __future__ import annotations

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
PACKAGE_ROOT = Path(__file__).resolve().parents[1]

MODEL_CONTEXT_LIMIT = 1024
PRIMARY_BASE_MODEL_ID = "teapotai/teapotllm"
DATASET_VERSION = "public-profile-v1"

DATA_DIR = PACKAGE_ROOT / "data"
CHECKPOINT_DIR = PACKAGE_ROOT / "checkpoints"
MERGED_DIR = PACKAGE_ROOT / "merged"
ONNX_DIR = PACKAGE_ROOT / "onnx"
REPORT_DIR = PACKAGE_ROOT / "reports"

DEFAULT_DATASET_PATH = DATA_DIR / "profile_qa.jsonl"
DEFAULT_TRAIN_OUTPUT_DIR = CHECKPOINT_DIR / "teapot-profile-qa-lora"
DEFAULT_EVAL_REPORT_PATH = REPORT_DIR / "profile_qa_eval.json"

LORA_RANK = 16
LORA_ALPHA = 32
LORA_DROPOUT = 0.03
TRAIN_BATCH_SIZE = 1
EVAL_BATCH_SIZE = 1
GRADIENT_ACCUMULATION_STEPS = 8
MAX_STEPS = 720
LEARNING_RATE = 1e-4
WEIGHT_DECAY = 0.01
WARMUP_RATIO = 0.03
EVAL_STEPS = 40
SAVE_STEPS = 40
