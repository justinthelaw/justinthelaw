#!/usr/bin/env python3
"""Shared utilities and configuration for pipeline scripts."""

from pathlib import Path
from typing import TypedDict

import yaml

# Paths
PIPELINE_DIR = Path(__file__).parent.parent
CONFIG_FILE = PIPELINE_DIR / 'config.yaml'


class ServerConfig(TypedDict):
    """Server configuration."""

    host: str
    port: int
    timeout: int
    health_check_timeout: int


class ModelConfig(TypedDict):
    """Model configuration."""

    base: str
    hub_id: str


class LoraConfig(TypedDict):
    """LoRA hyperparameters."""

    r: int
    alpha: int
    dropout: float
    target_modules: list[str]


class SFTConfig(TypedDict):
    """SFT training configuration."""

    epochs: int
    batch_size: int
    gradient_accumulation: int
    learning_rate: float
    warmup_ratio: float
    weight_decay: float
    max_length: int
    seed: int
    gradient_checkpointing: bool
    logging_steps: int
    packing: bool
    group_by_length: bool
    dataloader_num_workers: int
    eval_strategy: str
    save_strategy: str
    load_best_model_at_end: bool
    save_total_limit: int


class TemperaturesConfig(TypedDict):
    """Generation temperatures."""

    question: float
    answer: float
    variation: float


class LLMDefaults(TypedDict):
    """Default LLM parameters for generation."""

    temperature: float
    max_tokens: int
    variation_max_tokens: int
    long_question_skip_prob: float
    stop_sequences: list[str]


class ValidationConfig(TypedDict):
    """Validation thresholds."""

    context_token_warn: int


class GenerationLimits(TypedDict):
    """Generation and cleaning limits."""

    question_max_tokens: int
    answer_max_tokens: int
    min_question_length: int
    min_answer_length: int
    min_variation_length: int
    max_question_words: int
    max_answer_sentences: int
    max_answer_words: int


class InferenceConfig(TypedDict):
    """Inference defaults."""

    temperature: float
    max_new_tokens: int
    repetition_penalty: float
    top_k: int


class QuantizationConfig(TypedDict):
    """Quantization settings."""

    block_size: int
    accuracy_level: int


class EvaluationThresholdsConfig(TypedDict):
    """Evaluation threshold configuration."""

    exact_match_rate_min: float
    token_f1_min: float
    keyword_coverage_min: float
    refusal_accuracy_min: float
    response_length_compliance_min: float
    behavior_accuracy_min: float
    fp32_alignment_min: float
    case_token_f1_min: float
    case_keyword_coverage_min: float
    p95_latency_ms_max: dict[str, float]


class EvaluationHubConfig(TypedDict):
    """Published HuggingFace references for evaluation metadata snapshots."""

    model_id: str
    dataset_id: str


class EvaluationConfig(TypedDict):
    """Evaluation suite configuration."""

    seed: int
    smoke_samples: int
    full_samples_per_set: int
    max_new_tokens: int
    report_output: str
    eval_data_dir: str
    refusal_markers: list[str]
    thresholds: EvaluationThresholdsConfig
    hub: EvaluationHubConfig


class DatasetConfig(TypedDict):
    """Dataset generation configuration."""

    samples_per_category: int
    variations_per_question: int
    train_split: float
    seed: int
    temperatures: TemperaturesConfig
    hub_id: str
    include_military: bool
    has_recommendations: bool


class Config(TypedDict):
    """Complete pipeline configuration schema."""

    person_name: str
    person_full_name: str
    resume_path: str
    dataset_output: str
    model_output: str
    merged_output: str
    onnx_output: str
    server: ServerConfig
    validation: ValidationConfig
    llm_defaults: LLMDefaults
    model: ModelConfig
    lora: LoraConfig
    sft: SFTConfig
    dataset: DatasetConfig
    inference: InferenceConfig
    generation_limits: GenerationLimits
    quantization: QuantizationConfig
    evaluation: EvaluationConfig


def load_config() -> Config:
    """Load and return typed configuration from config.yaml."""
    return yaml.safe_load(CONFIG_FILE.read_text())


# Load config once at module level
CONFIG: Config = load_config()

# Must match frontend's buildSmarterSystemMessage() in src/services/ai/contextProvider.ts
SYSTEM_PROMPT = (
    f"You are {CONFIG['person_full_name']}'s AI assistant. "
    f"Answer questions about {CONFIG['person_name']} using only the provided context. "
    f"Give informative but concise answers in 1-{CONFIG['generation_limits']['max_answer_sentences']} short sentences."
)


def get_model_size_mb(model_path: Path) -> float:
    """Calculate model file size in MB."""
    return model_path.stat().st_size / 1024 / 1024


# LLM defaults
LLM_DEFAULT_TEMPERATURE = CONFIG['llm_defaults']['temperature']
LLM_DEFAULT_MAX_TOKENS = CONFIG['llm_defaults']['max_tokens']
LLM_VARIATION_MAX_TOKENS = CONFIG['llm_defaults']['variation_max_tokens']
LONG_QUESTION_SKIP_PROB = CONFIG['llm_defaults']['long_question_skip_prob']
STOP_SEQUENCES = CONFIG['llm_defaults']['stop_sequences']

# Constants for validation
MIN_QUESTION_LENGTH = CONFIG['generation_limits']['min_question_length']
MIN_ANSWER_LENGTH = CONFIG['generation_limits']['min_answer_length']
MIN_VARIATION_LENGTH = CONFIG['generation_limits']['min_variation_length']
MAX_QUESTION_WORDS = CONFIG['generation_limits']['max_question_words']
MAX_ANSWER_SENTENCES = CONFIG['generation_limits']['max_answer_sentences']
MAX_ANSWER_WORDS = CONFIG['generation_limits']['max_answer_words']
CONTEXT_TOKEN_WARN = CONFIG['validation']['context_token_warn']
HEALTH_CHECK_TIMEOUT = CONFIG['server']['health_check_timeout']

# Generation limits
QUESTION_MAX_TOKENS = CONFIG['generation_limits']['question_max_tokens']
ANSWER_MAX_TOKENS = CONFIG['generation_limits']['answer_max_tokens']

# Quantization constants
QUANTIZATION_BLOCK_SIZE = CONFIG['quantization']['block_size']
QUANTIZATION_ACCURACY_LEVEL = CONFIG['quantization']['accuracy_level']

# Inference defaults
INFERENCE_MAX_NEW_TOKENS = CONFIG['inference']['max_new_tokens']
INFERENCE_REPETITION_PENALTY = CONFIG['inference']['repetition_penalty']

# Evaluation defaults
EVAL_MAX_NEW_TOKENS = CONFIG['evaluation']['max_new_tokens']
EVAL_REPORT_OUTPUT = CONFIG['evaluation']['report_output']
EVAL_DATA_DIR = CONFIG['evaluation']['eval_data_dir']
