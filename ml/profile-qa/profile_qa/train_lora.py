"""Local 8GB-safe LoRA/QLoRA continuation training for profile Q&A."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Any

from .config import (
    DEFAULT_DATASET_PATH,
    DEFAULT_TRAIN_OUTPUT_DIR,
    EVAL_STEPS,
    EVAL_BATCH_SIZE,
    GRADIENT_ACCUMULATION_STEPS,
    LEARNING_RATE,
    LORA_ALPHA,
    LORA_DROPOUT,
    LORA_RANK,
    MAX_STEPS,
    MODEL_CONTEXT_LIMIT,
    PRIMARY_BASE_MODEL_ID,
    SAVE_STEPS,
    TRAIN_BATCH_SIZE,
    WARMUP_RATIO,
    WEIGHT_DECAY,
)
from .gpu_health import assert_gpu_ready
from .synthetic_data import profile_context_text
from .validation import read_jsonl

TEAPOT_MODEL_TYPE = "t5"
TEAPOT_LORA_TARGET_MODULES = ["q", "v"]


def ensure_primary_base_model_id(model_id: str, *, source: str) -> None:
    """Reject alternate base models; this pipeline continues only TeapotLLM."""

    normalized_model_id = model_id.rstrip("/")
    if normalized_model_id == PRIMARY_BASE_MODEL_ID:
        return

    raise RuntimeError(
        f"profile-QA is TeapotLLM-only; {source} must use {PRIMARY_BASE_MODEL_ID}, "
        f"got {model_id}"
    )


def _missing_dependency(name: str, install_hint: str) -> RuntimeError:
    return RuntimeError(f"Missing optional dependency {name}. Install with: {install_hint}")


def format_instruction(record: dict[str, Any]) -> str:
    """Format a record as a profile-QA instruction prompt."""

    history = record.get("history", [])
    history_text = ""
    if isinstance(history, list) and history:
        turns = []
        for turn in history:
            if isinstance(turn, dict):
                role = str(turn.get("role", "")).title()
                content = str(turn.get("content", ""))
                turns.append(f"{role}: {content}")
        history_text = "\nRecent conversation:\n" + "\n".join(turns)

    return (
        "You are Justin Law's browser-only profile Q&A assistant. "
        "Use only the public profile context. If the context does not answer, say so. "
        "If a question asks for multiple facts, include each requested fact.\n\n"
        f"Public profile context:\n{profile_context_text()}\n"
        f"{history_text}\n\n"
        f"Question: {record['question']}\n"
        "Answer:"
    )


def _load_training_stack() -> dict[str, Any]:
    try:
        import torch
    except ImportError as exc:
        raise _missing_dependency("torch", "pip install -r ml/profile-qa/requirements.txt") from exc

    try:
        from datasets import Dataset
        from peft import (
            LoraConfig,
            PeftConfig,
            PeftModel,
            get_peft_model,
            prepare_model_for_kbit_training,
        )
        from transformers import (
            AutoConfig,
            AutoModelForSeq2SeqLM,
            AutoTokenizer,
            BitsAndBytesConfig,
            DataCollatorForSeq2Seq,
            EarlyStoppingCallback,
            Seq2SeqTrainer,
            Seq2SeqTrainingArguments,
        )
    except ImportError as exc:
        raise _missing_dependency(
            "training stack",
            "pip install -r ml/profile-qa/requirements.txt",
        ) from exc

    return {
        "torch": torch,
        "Dataset": Dataset,
        "LoraConfig": LoraConfig,
        "PeftConfig": PeftConfig,
        "PeftModel": PeftModel,
        "get_peft_model": get_peft_model,
        "prepare_model_for_kbit_training": prepare_model_for_kbit_training,
        "AutoConfig": AutoConfig,
        "AutoModelForSeq2SeqLM": AutoModelForSeq2SeqLM,
        "AutoTokenizer": AutoTokenizer,
        "BitsAndBytesConfig": BitsAndBytesConfig,
        "DataCollatorForSeq2Seq": DataCollatorForSeq2Seq,
        "EarlyStoppingCallback": EarlyStoppingCallback,
        "Seq2SeqTrainer": Seq2SeqTrainer,
        "Seq2SeqTrainingArguments": Seq2SeqTrainingArguments,
    }


def ensure_teapot_seq2seq_config(config: Any, model_id: str) -> None:
    """Reject non-Teapot/T5 configs before training or evaluation."""

    model_type = str(getattr(config, "model_type", "")).lower()
    is_encoder_decoder = bool(getattr(config, "is_encoder_decoder", False))
    if is_encoder_decoder and model_type == TEAPOT_MODEL_TYPE:
        return

    raise RuntimeError(
        "profile-QA is TeapotLLM-only; expected a T5 encoder-decoder config "
        f"from {PRIMARY_BASE_MODEL_ID}, got model_type={model_type or 'unknown'} "
        f"and is_encoder_decoder={is_encoder_decoder} for {model_id}"
    )


def run_training(args: argparse.Namespace) -> None:
    assert_gpu_ready(min_vram_gb=args.min_vram_gb)
    stack = _load_training_stack()
    torch = stack["torch"]

    records = read_jsonl(Path(args.dataset))
    train_records = [record for record in records if record.get("split") == "train"]
    eval_records = [record for record in records if record.get("split") == "validation"]
    if not train_records:
        raise RuntimeError("dataset has no train records")
    if not eval_records:
        raise RuntimeError("dataset has no validation records")

    model_id = PRIMARY_BASE_MODEL_ID
    config = stack["AutoConfig"].from_pretrained(model_id, trust_remote_code=True)
    ensure_teapot_seq2seq_config(config, model_id)
    tokenizer = stack["AutoTokenizer"].from_pretrained(model_id, trust_remote_code=True)
    if tokenizer.pad_token is None and tokenizer.eos_token is not None:
        tokenizer.pad_token = tokenizer.eos_token

    compute_dtype = torch.bfloat16 if torch.cuda.is_bf16_supported() else torch.float16
    quantization_config = stack["BitsAndBytesConfig"](
        load_in_4bit=args.quantization == "4bit",
        load_in_8bit=args.quantization == "8bit",
        bnb_4bit_compute_dtype=compute_dtype,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_use_double_quant=True,
    )

    model = stack["AutoModelForSeq2SeqLM"].from_pretrained(
        model_id,
        device_map="auto",
        quantization_config=quantization_config,
        trust_remote_code=True,
    )
    model.gradient_checkpointing_enable()
    model = stack["prepare_model_for_kbit_training"](model)
    if args.adapter_model_id:
        adapter_config = stack["PeftConfig"].from_pretrained(args.adapter_model_id)
        adapter_base_model_id = str(getattr(adapter_config, "base_model_name_or_path", ""))
        ensure_primary_base_model_id(
            adapter_base_model_id,
            source=f"{args.adapter_model_id} adapter base",
        )
        model = stack["PeftModel"].from_pretrained(
            model,
            args.adapter_model_id,
            is_trainable=True,
        )
    else:
        lora_config = stack["LoraConfig"](
            r=args.lora_rank,
            lora_alpha=args.lora_alpha,
            lora_dropout=args.lora_dropout,
            bias="none",
            task_type="SEQ_2_SEQ_LM",
            target_modules=TEAPOT_LORA_TARGET_MODULES,
        )
        model = stack["get_peft_model"](model, lora_config)

    dataset_cls = stack["Dataset"]
    train_dataset = dataset_cls.from_list(train_records)
    eval_dataset = dataset_cls.from_list(eval_records)

    def tokenize_seq2seq(batch: dict[str, list[Any]]) -> dict[str, Any]:
        prompts = [format_instruction(record) for record in _batch_records(batch)]
        answers = [str(answer) for answer in batch["answer"]]
        model_inputs = tokenizer(
            prompts,
            max_length=MODEL_CONTEXT_LIMIT,
            truncation=True,
            padding=False,
        )
        labels = tokenizer(
            text_target=answers,
            max_length=160,
            truncation=True,
            padding=False,
        )
        model_inputs["labels"] = labels["input_ids"]
        return model_inputs

    tokenized_train = train_dataset.map(
        tokenize_seq2seq, batched=True, remove_columns=train_dataset.column_names
    )
    tokenized_eval = eval_dataset.map(
        tokenize_seq2seq, batched=True, remove_columns=eval_dataset.column_names
    )
    training_args = stack["Seq2SeqTrainingArguments"](
        output_dir=args.output_dir,
        per_device_train_batch_size=args.train_batch_size,
        per_device_eval_batch_size=args.eval_batch_size,
        gradient_accumulation_steps=args.gradient_accumulation_steps,
        learning_rate=args.learning_rate,
        max_steps=args.max_steps,
        lr_scheduler_type=args.lr_scheduler_type,
        warmup_ratio=args.warmup_ratio,
        weight_decay=args.weight_decay,
        optim=args.optim,
        fp16=compute_dtype == torch.float16,
        bf16=compute_dtype == torch.bfloat16,
        gradient_checkpointing=True,
        logging_steps=10,
        eval_strategy="steps",
        eval_steps=args.eval_steps,
        save_strategy="steps",
        save_steps=args.save_steps,
        save_total_limit=3,
        load_best_model_at_end=True,
        metric_for_best_model="eval_loss",
        greater_is_better=False,
        predict_with_generate=False,
        report_to="none",
    )
    callbacks = []
    if args.early_stopping_patience > 0:
        callbacks.append(
            stack["EarlyStoppingCallback"](
                early_stopping_patience=args.early_stopping_patience
            )
        )
    trainer = stack["Seq2SeqTrainer"](
        model=model,
        args=training_args,
        train_dataset=tokenized_train,
        eval_dataset=tokenized_eval,
        tokenizer=tokenizer,
        data_collator=stack["DataCollatorForSeq2Seq"](tokenizer=tokenizer, model=model),
        callbacks=callbacks,
    )

    trainer.train(resume_from_checkpoint=args.resume)
    trainer.save_model(args.output_dir)
    tokenizer.save_pretrained(args.output_dir)


def _batch_records(batch: dict[str, list[Any]]) -> list[dict[str, Any]]:
    keys = list(batch.keys())
    size = len(batch[keys[0]]) if keys else 0
    return [{key: batch[key][index] for key in keys} for index in range(size)]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dataset", default=str(DEFAULT_DATASET_PATH))
    parser.add_argument("--adapter-model-id")
    parser.add_argument("--output-dir", default=str(DEFAULT_TRAIN_OUTPUT_DIR))
    parser.add_argument("--quantization", choices=["4bit", "8bit"], default="4bit")
    parser.add_argument("--max-steps", type=int, default=MAX_STEPS)
    parser.add_argument("--learning-rate", type=float, default=LEARNING_RATE)
    parser.add_argument("--weight-decay", type=float, default=WEIGHT_DECAY)
    parser.add_argument("--warmup-ratio", type=float, default=WARMUP_RATIO)
    parser.add_argument("--lr-scheduler-type", default="cosine")
    parser.add_argument("--optim", default="paged_adamw_8bit")
    parser.add_argument("--lora-rank", type=int, default=LORA_RANK)
    parser.add_argument("--lora-alpha", type=int, default=LORA_ALPHA)
    parser.add_argument("--lora-dropout", type=float, default=LORA_DROPOUT)
    parser.add_argument("--eval-steps", type=int, default=EVAL_STEPS)
    parser.add_argument("--save-steps", type=int, default=SAVE_STEPS)
    parser.add_argument(
        "--gradient-accumulation-steps",
        type=int,
        default=GRADIENT_ACCUMULATION_STEPS,
    )
    parser.add_argument("--train-batch-size", type=int, default=TRAIN_BATCH_SIZE)
    parser.add_argument("--eval-batch-size", type=int, default=EVAL_BATCH_SIZE)
    parser.add_argument("--early-stopping-patience", type=int, default=4)
    parser.add_argument("--min-vram-gb", type=float, default=7.0)
    parser.add_argument("--resume", action="store_true")
    args = parser.parse_args()

    run_training(args)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
