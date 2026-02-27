---
license: apache-2.0
language:
  - en
task_categories:
  - text-generation
  - question-answering
tags:
  - sft
  - lora
  - resume
  - chatbot
  - fine-tuning
  - conversational
size_categories:
  - 1K<n<10K
---

# {dataset_hub_id}

A Supervised Fine-Tuning (SFT) dataset generated from **{person_name}**'s resume for fine-tuning language models to answer questions about professional background, skills, and experience. This dataset consists of synthetically generated QA pairs.

## Dataset Statistics

- **Total Samples**: ~{total_samples} (estimated, with {variations_per_question}x variations per unique question)
- **Train Split**: {train_split_percent}%
- **Validation Split**: {val_split_percent}%
- **Samples per Category**: {samples_per_category}

## Dataset Structure

### SFT Format (`sft/`)

Conversation-formatted samples for supervised fine-tuning:

| Field      | Type | Description                                         |
| ---------- | ---- | --------------------------------------------------- |
| `messages` | list | Conversation with system, user, and assistant turns |

```json
{
  "messages": [
    { "role": "system", "content": "You are {person_name}'s AI assistant..." },
    { "role": "user", "content": "What is {person_name}'s current role?" },
    { "role": "assistant", "content": "[Accurate response based on resume]" }
  ]
}
```

## Dataset Creation

### Generation Process

1. **Resume Extraction**: PDF resume parsed using PyMuPDF
2. **Question Generation**: LLM-generated questions across multiple categories using llama-server
3. **Question Variations**: Multiple paraphrases per question for training robustness
4. **Answer Generation**: Accurate answers generated with full resume context

### Source Data

The dataset was generated from {person_name}'s professional resume, which includes information about:

{categories_list}

## Intended Use

This dataset is intended for:

- Supervised fine-tuning for personalized Q&A models
- Training resume chatbots with factual memorization
- Demonstrating LoRA SFT techniques for small language models

## Limitations

- Specific to {person_name}'s resume; not generalizable to other individuals
- Generated responses may contain minor inaccuracies
- Limited to information available in the source resume
- Question diversity depends on LLM generation quality

## Author

### {person_name}

- GitHub: [{github_username}](https://github.com/{github_username})
- HuggingFace: [{hf_username}](https://huggingface.co/{hf_username})

## License

This dataset is released under the Apache 2.0 license.
