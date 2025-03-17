from datasets import load_dataset
from trl import DPOConfig, DPOTrainer
from transformers import AutoModelForCausalLM, AutoTokenizer

model = AutoModelForCausalLM.from_pretrained("HuggingFaceTB/SmolLM2-135M-Instruct")
tokenizer = AutoTokenizer.from_pretrained("HuggingFaceTB/SmolLM2-135M-Instruct")
train_dataset = load_dataset("justinthelaw/Justin-Wing-Chung-Law_DPO", split="train")

training_args = DPOConfig(
    output_dir=".models/SmolLM2-135M-Instruct-Justin-Law-Fine-Tune", logging_steps=10
)
trainer = DPOTrainer(
    model=model,
    args=training_args,
    processing_class=tokenizer,
    train_dataset=train_dataset,
)
trainer.train()
