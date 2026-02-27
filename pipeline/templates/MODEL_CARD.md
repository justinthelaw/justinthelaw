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
  - lora
  - resume
  - chatbot
base_model: "{base_model}"
datasets:
  - "{dataset_hub_id}"
pipeline_tag: text-generation
---

# {model_hub_id}

A fine-tuned version of [{base_model}](https://huggingface.co/{base_model}) trained with an SFT + LoRA pipeline to answer questions about **{person_name}**'s professional background, skills, and experience.

## Model Description

This model is designed for browser-based inference using [transformers.js](https://huggingface.co/docs/transformers.js). It powers a personal website chatbot that can answer questions about {person_name}'s resume, work experience, education, and skills.

### Training Pipeline

The model is trained using **SFT (Supervised Fine-Tuning)** with **LoRA adapters**, where factual memorization is enforced via conversation-formatted QA pairs.

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

## Model Formats

This repository contains multiple model formats:

| Format      | Location   | Use Case                                                  |
| ----------- | ---------- | --------------------------------------------------------- |
| SafeTensors | `/` (root) | Python/PyTorch inference                                  |
| ONNX        | `/onnx/`   | FP32 + quantized weights for ONNX Runtime/Web inference   |

## Usage

### Browser (transformers.js)

```javascript
import { pipeline } from "@huggingface/transformers";

const generator = await pipeline("text-generation", "{model_hub_id}", {
  dtype: "fp32",
});

const output = await generator("What is {person_name}'s background?", {
  max_new_tokens: 256,
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
