#!/usr/bin/env python3
"""Train LoRA adapter using DPO. Run after SFT for preference alignment."""

import sys
from pathlib import Path

import torch
import yaml
from datasets import load_from_disk
from peft import LoraConfig, PeftModel, get_peft_model
from transformers import AutoModelForCausalLM, AutoTokenizer
from trl import DPOConfig, DPOTrainer

PIPELINE_DIR = Path(__file__).parent.parent
CONFIG = yaml.safe_load((PIPELINE_DIR / "config.yaml").read_text())


def main() -> int:
    dpo_dataset_path = PIPELINE_DIR / CONFIG["dataset_output"] / "dpo"
    lora_path = PIPELINE_DIR / CONFIG["model_output"]
    output_dir = PIPELINE_DIR / CONFIG["model_output"]

    # Check for DPO dataset
    if not dpo_dataset_path.exists():
        # Fall back to old dataset location for backwards compatibility
        dpo_dataset_path = PIPELINE_DIR / CONFIG["dataset_output"]
        if not dpo_dataset_path.exists():
            print(f"Error: Dataset not found at {dpo_dataset_path}")
            print("Run 'make generate' first")
            return 1

    # Load dataset
    print(f"Loading DPO dataset from {dpo_dataset_path}")
    dataset = load_from_disk(str(dpo_dataset_path))
    print(f"  Train: {len(dataset['train'])}, Validation: {len(dataset['validation'])}")

    # Continue SFT LoRA if exists, otherwise create fresh
    model_name = CONFIG["model"]["base"]
    sft_adapter_exists = (lora_path / "adapter_config.json").exists()

    if sft_adapter_exists:
        print(f"\nLoading SFT-trained model from {lora_path}")
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype="auto",
            device_map="auto",
            trust_remote_code=True,
        )
        model = PeftModel.from_pretrained(model, str(lora_path), is_trainable=True)
        tokenizer = AutoTokenizer.from_pretrained(str(lora_path))
        print(f"  Continuing SFT LoRA with DPO")
    else:
        print(f"\nNo SFT adapter found. Loading base model: {model_name}")
        print("⚠️  Warning: DPO without SFT may reduce memorization")
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            torch_dtype="auto",
            device_map="auto",
            trust_remote_code=True,
        )
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        # Fresh LoRA for DPO-only training
        lora_cfg = CONFIG["lora"]
        peft_config = LoraConfig(
            r=lora_cfg["r"],
            lora_alpha=lora_cfg["alpha"],
            lora_dropout=lora_cfg["dropout"],
            target_modules=lora_cfg["target_modules"],
            bias="none",
            task_type="CAUSAL_LM",
        )
        model = get_peft_model(model, peft_config)

    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    print(f"  Parameters: {total:,}")
    print(
        f"  LoRA: {trainable:,} trainable / {total:,} total ({100*trainable/total:.2f}%)"
    )

    # DPO config
    train_cfg = CONFIG["training"]
    dpo_cfg = CONFIG["dpo"]

    use_bf16 = False
    use_fp16 = False
    use_gradient_checkpointing = torch.cuda.is_available()

    if use_gradient_checkpointing:
        model.enable_input_require_grads()

    training_args = DPOConfig(
        output_dir=str(output_dir),
        num_train_epochs=train_cfg["epochs"],
        per_device_train_batch_size=train_cfg["batch_size"],
        per_device_eval_batch_size=train_cfg["batch_size"],
        gradient_accumulation_steps=train_cfg["gradient_accumulation"],
        learning_rate=train_cfg["learning_rate"],
        warmup_ratio=train_cfg["warmup_ratio"],
        label_smoothing=dpo_cfg.get("label_smoothing", 0.0),
        bf16=use_bf16,
        fp16=use_fp16,
        gradient_checkpointing=use_gradient_checkpointing,
        logging_steps=10,
        eval_strategy="epoch",
        save_strategy="no",
        seed=train_cfg["seed"],
        beta=dpo_cfg["beta"],
        loss_type=dpo_cfg["loss_type"],
        report_to="none",
    )

    print("\nStarting DPO training...")
    print(f"  Epochs: {train_cfg['epochs']}")
    print(f"  Learning rate: {train_cfg['learning_rate']}")
    print(f"  DPO beta: {dpo_cfg['beta']}")

    trainer = DPOTrainer(
        model=model,
        args=training_args,
        train_dataset=dataset["train"],
        eval_dataset=dataset["validation"],
        processing_class=tokenizer,
    )
    trainer.train()

    # Save
    print(f"\nSaving to {output_dir}")
    trainer.save_model(str(output_dir))
    if not tokenizer.chat_template:
        print("⚠️  Warning: Tokenizer has no chat_template.")
    tokenizer.save_pretrained(str(output_dir))

    print("\nDPO Training complete!")
    print("Next: make merge")
    return 0


if __name__ == "__main__":
    sys.exit(main())
