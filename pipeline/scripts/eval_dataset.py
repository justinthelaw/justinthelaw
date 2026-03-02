#!/usr/bin/env python3
"""Evaluation dataset loaders and sampling utilities."""

from __future__ import annotations

import json
import random
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from datasets import DatasetDict, load_from_disk

ExpectedBehavior = Literal['answer', 'refuse']


@dataclass(frozen=True, slots=True)
class EvalCase:
    """Single evaluation case."""

    case_id: str
    dataset: str
    category: str
    question: str
    reference_answer: str
    expected_behavior: ExpectedBehavior
    tags: tuple[str, ...]


def _clean_text(value: object) -> str:
    """Normalize unknown JSON values to text."""
    if isinstance(value, str):
        return value.strip()
    return ''


def _parse_expected_behavior(value: object) -> ExpectedBehavior:
    """Parse expected behavior from JSON record."""
    text = _clean_text(value).lower()
    if text == 'refuse':
        return 'refuse'
    return 'answer'


def _parse_tags(value: object) -> tuple[str, ...]:
    """Parse tags from JSON list."""
    if not isinstance(value, list):
        return tuple()
    tags = [item.strip() for item in value if isinstance(item, str) and item.strip()]
    return tuple(tags)


def _infer_validation_category(question: str) -> str:
    """Infer coarse category from question text."""
    text = question.lower()
    category_keywords: dict[str, tuple[str, ...]] = {
        'work_experience': ('work', 'job', 'company', 'career', 'role', 'position'),
        'skills': ('skill', 'technology', 'tool', 'framework', 'language'),
        'education': ('school', 'degree', 'education', 'university', 'college'),
        'projects': ('project', 'build', 'portfolio', 'develop'),
        'leadership': ('lead', 'manage', 'mentor', 'team'),
        'achievements': ('award', 'achievement', 'accomplishment', 'recognition'),
        'character': ('hobby', 'interest', 'personality', 'describe'),
        'military_service': ('military', 'space force', 'air force', 'officer', 'service'),
    }
    for category, keywords in category_keywords.items():
        if any(keyword in text for keyword in keywords):
            return category
    return 'general'


def deterministic_sample(items: list[EvalCase], limit: int, seed: int) -> list[EvalCase]:
    """Take a deterministic pseudo-random sample from a list."""
    if limit <= 0 or len(items) <= limit:
        return list(items)
    indices = list(range(len(items)))
    rng = random.Random(seed)  # noqa: S311 - deterministic evaluation sampling
    rng.shuffle(indices)
    selected = sorted(indices[:limit])
    return [items[index] for index in selected]


def load_curated_eval_sets(eval_dir: Path) -> dict[str, list[EvalCase]]:
    """Load curated eval sets from JSONL files."""
    dataset_files = {
        'golden': eval_dir / 'golden.jsonl',
        'adversarial': eval_dir / 'adversarial.jsonl',
        'ood': eval_dir / 'ood.jsonl',
    }
    loaded: dict[str, list[EvalCase]] = {}

    for dataset_name, file_path in dataset_files.items():
        if not file_path.exists():
            loaded[dataset_name] = []
            continue
        loaded[dataset_name] = _load_eval_jsonl(file_path, dataset_name)

    return loaded


def _load_eval_jsonl(file_path: Path, dataset_name: str) -> list[EvalCase]:
    """Load one curated JSONL file."""
    cases: list[EvalCase] = []
    with file_path.open(encoding='utf-8') as file_handle:
        for line_number, line in enumerate(file_handle, start=1):
            raw_line = line.strip()
            if not raw_line:
                continue
            try:
                record = json.loads(raw_line)
            except json.JSONDecodeError:
                print(f'Warning: Invalid JSON in {file_path}:{line_number}')
                continue

            if not isinstance(record, dict):
                print(f'Warning: Skipping non-object record in {file_path}:{line_number}')
                continue

            question = _clean_text(record.get('question'))
            if not question:
                print(f'Warning: Missing question in {file_path}:{line_number}')
                continue

            case_id = _clean_text(record.get('id')) or f'{dataset_name}-{line_number}'
            category = _clean_text(record.get('category')) or 'general'
            reference_answer = _clean_text(record.get('reference_answer'))
            expected_behavior = _parse_expected_behavior(record.get('expected_behavior'))
            tags = _parse_tags(record.get('tags'))

            cases.append(
                EvalCase(
                    case_id=case_id,
                    dataset=dataset_name,
                    category=category,
                    question=question,
                    reference_answer=reference_answer,
                    expected_behavior=expected_behavior,
                    tags=tags,
                )
            )

    return cases


def load_validation_eval_set(
    sft_dataset_path: Path,
    limit: int,
    seed: int,
) -> list[EvalCase]:
    """Build eval cases from SFT validation split."""
    if not sft_dataset_path.exists():
        return []

    dataset_obj = load_from_disk(str(sft_dataset_path))
    if not isinstance(dataset_obj, DatasetDict):
        print(f'Warning: Expected DatasetDict at {sft_dataset_path}, got {type(dataset_obj).__name__}')
        return []

    split_name = 'validation' if 'validation' in dataset_obj else 'train'
    split = dataset_obj[split_name]

    total_rows = len(split)
    if total_rows == 0:
        return []

    row_indices = list(range(total_rows))
    rng = random.Random(seed)  # noqa: S311 - deterministic evaluation sampling
    rng.shuffle(row_indices)
    selected = row_indices[:limit] if limit > 0 else row_indices

    eval_cases: list[EvalCase] = []
    for row_index in selected:
        row = split[row_index]

        messages = row.get('messages')
        question = _extract_role_content(messages, role='user')
        reference_answer = _extract_role_content(messages, role='assistant')

        if not question:
            continue

        eval_cases.append(
            EvalCase(
                case_id=f'validation-{row_index}',
                dataset='validation',
                category=_infer_validation_category(question),
                question=question,
                reference_answer=reference_answer,
                expected_behavior='answer',
                tags=('validation_holdout',),
            )
        )

    return eval_cases


def _extract_role_content(messages: object, role: str) -> str:
    """Extract first content string for a message role."""
    if not isinstance(messages, list):
        return ''
    for message in messages:
        if not isinstance(message, dict):
            continue
        raw_role = message.get('role')
        raw_content = message.get('content')
        if raw_role == role and isinstance(raw_content, str):
            return raw_content.strip()
    return ''
