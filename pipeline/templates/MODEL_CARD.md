---
license: apache-2.0
language:
  - en
library_name: transformers
tags:
  - smollm2
  - onnx
  - transformers.js
  - text-generation
  - fine-tuned
  - sft
  - dpo
  - lora
  - resume
  - chatbot
base_model: "{base_model}"
datasets:
  - "{dataset_hub_id}"
pipeline_tag: text-generation
---

# {model_hub_id}

A fine-tuned version of [{base_model}](https://huggingface.co/{base_model}) trained with a two-stage pipeline (SFT + DPO) to answer questions about **{person_name}**'s professional background, skills, and experience.

## Model Description

This model is designed for browser-based inference using [transformers.js](https://huggingface.co/docs/transformers.js). It powers a personal website chatbot that can answer questions about {person_name}'s resume, work experience, education, and skills.

### Training Pipeline

The model is trained using a two-stage approach optimized for factual memorization:

1. **SFT (Supervised Fine-Tuning)**: Primary training for factual memorization using conversation-formatted QA pairs
2. **DPO (Direct Preference Optimization)**: Refinement training to prefer accurate answers over hallucinations

### Training Details

- **Base Model**: [{base_model}](https://huggingface.co/{base_model})
- **Training Dataset**: [{dataset_hub_id}](https://huggingface.co/datasets/{dataset_hub_id})
- **LoRA Configuration**:
  - Rank (r): {lora_r}
  - Alpha: {lora_alpha}
  - Dropout: {lora_dropout}
  - Target Modules: {lora_target_modules}

#### SFT Training Configuration

- Epochs: {sft_epochs}
- Batch Size: {sft_batch_size}
- Learning Rate: {sft_learning_rate}
- Max Length: {sft_max_length}

#### DPO Training Configuration

- Epochs: {training_epochs}
- Batch Size: {training_batch_size}
- Learning Rate: {training_learning_rate}
- Max Length: {training_max_length}
- Beta: {dpo_beta}
- Loss Type: {dpo_loss_type}

## Model Formats

This repository contains multiple model formats:

| Format         | Location                     | Use Case                            |
| -------------- | ---------------------------- | ----------------------------------- |
| SafeTensors    | `/` (root)                   | Python/PyTorch inference            |
| ONNX           | `/onnx/model.onnx`           | Full precision ONNX Runtime         |
| ONNX Quantized | `/onnx/model_quantized.onnx` | Browser inference (transformers.js) |

> **Note**: If quantization fails during export due to weight distribution issues, `model_quantized.onnx` will be a copy of the fp16 model for compatibility.

## Usage

### Browser (transformers.js)

```javascript
import { pipeline } from "@huggingface/transformers";

const generator = await pipeline(
  "text-generation",
  "{model_hub_id}",
  { dtype: "q8" } // Uses model_quantized.onnx
);

const output = await generator("What is {person_name}'s background?", {
  max_new_tokens: 256,
  temperature: 0.7,
});
```

### Python (Transformers)

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

model = AutoModelForCausalLM.from_pretrained("{model_hub_id}")
tokenizer = AutoTokenizer.from_pretrained("{model_hub_id}")

prompt = "What is {person_name}'s background?"
inputs = tokenizer(prompt, return_tensors="pt")
outputs = model.generate(**inputs, max_new_tokens=256)
print(tokenizer.decode(outputs[0], skip_special_tokens=True))
```

## Intended Use

This model is intended for:

- Personal website chatbots
- Resume Q&A applications
- Demonstrating fine-tuning techniques for personalized AI assistants

## Limitations

- The model is specifically trained on {person_name}'s resume and may not generalize to other topics
- Responses are based on training data and may not reflect real-time information
- Not suitable for general-purpose question answering

## Author

### {person_name}

- GitHub: [{github_username}](https://github.com/{github_username})
- HuggingFace: [{hf_username}](https://huggingface.co/{hf_username})

## License

This model is released under the Apache 2.0 license.
