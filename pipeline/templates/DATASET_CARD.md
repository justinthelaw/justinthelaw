---
license: apache-2.0
language:
  - en
task_categories:
  - text-generation
  - question-answering
tags:
  - sft
  - dpo
  - resume
  - chatbot
  - preference-learning
  - fine-tuning
  - conversational
size_categories:
  - 1K<n<10K
---

# {dataset_hub_id}

A combined SFT and DPO dataset generated from **{person_name}**'s resume for fine-tuning language models to answer questions about professional background, skills, and experience.

## Dataset Description

This dataset contains two formats optimized for a two-stage training pipeline:

1. **SFT (Supervised Fine-Tuning)**: Conversation-formatted QA pairs for factual memorization
2. **DPO (Direct Preference Optimization)**: Preference pairs with chosen/rejected responses for alignment

### Dataset Statistics

- **Total Samples**: ~{total_samples} (estimated, with {variations_per_question}x variations per unique question)
- **Train Split**: {train_split_percent}%
- **Validation Split**: {val_split_percent}%
- **Samples per Category**: {samples_per_category}

### Question Categories

The dataset covers the following categories:
{categories_list}

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

### DPO Format (`dpo/`)

Preference pairs for Direct Preference Optimization:

| Field      | Type   | Description                                    |
| ---------- | ------ | ---------------------------------------------- |
| `prompt`   | string | The question being asked                       |
| `chosen`   | string | The preferred (correct) response               |
| `rejected` | string | The rejected (incorrect/hallucinated) response |

```json
{
  "prompt": "What is {person_name}'s current role?",
  "chosen": "[Detailed, accurate response based on resume]",
  "rejected": "[Generic or incorrect response]"
}
```

## Dataset Creation

### Generation Process

1. **Resume Extraction**: PDF resume parsed using PyMuPDF
2. **Question Generation**: LLM-generated questions across multiple categories using llama-server
3. **Question Variations**: Multiple paraphrases per question for training robustness
4. **Answer Generation**: Accurate answers generated with full resume context
5. **Rejected Response Generation**: Plausible but incorrect responses generated without context
6. **Dual Format Export**: Data formatted for both SFT and DPO training stages

### Generation Configuration

- **Question Temperature**: {temp_question} (higher for diverse questions)
- **Answer Temperature**: {temp_answer} (lower for consistent factual answers)
- **Rejected Temperature**: {temp_rejected} (high for varied hallucinations)
- **Variation Temperature**: {temp_variation} (for question paraphrasing)
- **Variations per Question**: {variations_per_question}
- **Random Seed**: {seed}

### Source Data

The dataset was generated from {person_name}'s professional resume, which includes information about:

- Work experience and roles
- Education and certifications
- Technical skills and expertise
- Projects and achievements
- Leadership experience
- Military service (if applicable)

## Intended Use

This dataset is intended for:

- Two-stage fine-tuning (SFT → DPO) for personalized Q&A models
- Training resume chatbots with factual memorization
- Demonstrating preference learning techniques for small language models

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
