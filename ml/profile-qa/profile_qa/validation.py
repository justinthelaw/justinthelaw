"""Dataset validation for local profile-QA examples."""

from __future__ import annotations

import json
from collections.abc import Iterable
from pathlib import Path
from typing import Any

from .public_profile import fact_index

VALID_SPLITS = {"train", "validation", "test"}
VALID_ROLES = {"user", "assistant"}
PRIVATE_DATA_MARKERS = {
    "ssn",
    "social security",
    "phone number",
    "street address",
    "home address",
    "personal email",
    "salary",
    "compensation",
    "classified",
    "secret clearance",
}


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    """Read a JSONL file into a list of records."""

    records: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            if not line.strip():
                continue
            try:
                value = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(f"{path}:{line_number}: invalid JSON") from exc
            if not isinstance(value, dict):
                raise ValueError(f"{path}:{line_number}: record must be an object")
            records.append(value)
    return records


def write_jsonl(path: Path, records: Iterable[dict[str, Any]]) -> None:
    """Write records to a JSONL file."""

    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        for record in records:
            handle.write(json.dumps(record, sort_keys=True))
            handle.write("\n")


def validate_record(record: dict[str, Any]) -> list[str]:
    """Return schema and safety errors for a single record."""

    errors: list[str] = []
    known_facts = fact_index()

    for key in [
        "id",
        "split",
        "task",
        "question",
        "answer",
        "evidence",
        "requires_refusal",
        "source_profile_version",
    ]:
        if key not in record:
            errors.append(f"missing {key}")

    if record.get("split") not in VALID_SPLITS:
        errors.append("split must be train, validation, or test")

    for key in ["id", "task", "question", "answer", "source_profile_version"]:
        if key in record and not isinstance(record[key], str):
            errors.append(f"{key} must be a string")

    if not isinstance(record.get("requires_refusal"), bool):
        errors.append("requires_refusal must be a boolean")

    evidence = record.get("evidence")
    if not isinstance(evidence, list):
        errors.append("evidence must be a list")
    else:
        if not record.get("requires_refusal") and len(evidence) == 0:
            errors.append("non-refusal examples require evidence")
        for index, item in enumerate(evidence):
            if not isinstance(item, dict):
                errors.append(f"evidence[{index}] must be an object")
                continue
            section_id = item.get("section_id")
            fact_id = item.get("fact_id")
            if not isinstance(section_id, str) or not isinstance(fact_id, str):
                errors.append(f"evidence[{index}] requires string section_id and fact_id")
                continue
            if (section_id, fact_id) not in known_facts:
                errors.append(f"evidence[{index}] references unknown fact")

    history = record.get("history", [])
    if not isinstance(history, list):
        errors.append("history must be a list when present")
    else:
        for index, turn in enumerate(history):
            if not isinstance(turn, dict):
                errors.append(f"history[{index}] must be an object")
                continue
            if turn.get("role") not in VALID_ROLES:
                errors.append(f"history[{index}].role must be user or assistant")
            if not isinstance(turn.get("content"), str):
                errors.append(f"history[{index}].content must be a string")

    expected_terms = record.get("expected_terms", [])
    if not isinstance(expected_terms, list) or not all(
        isinstance(term, str) for term in expected_terms
    ):
        errors.append("expected_terms must be a list of strings when present")

    text = f"{record.get('question', '')} {record.get('answer', '')}".lower()
    for marker in PRIVATE_DATA_MARKERS:
        if marker in text and not record.get("requires_refusal"):
            errors.append(f"private-data marker leaked into non-refusal example: {marker}")

    if record.get("requires_refusal"):
        answer = str(record.get("answer", "")).lower()
        if "does not say" not in answer and "not in the public profile" not in answer:
            errors.append("refusal answer must state the public profile does not say")

    return errors


def validate_dataset(records: Iterable[dict[str, Any]]) -> list[str]:
    """Return all validation errors for a dataset."""

    errors: list[str] = []
    seen_ids: set[str] = set()
    seen_questions_by_split: dict[str, set[str]] = {
        "train": set(),
        "validation": set(),
        "test": set(),
    }

    for index, record in enumerate(records):
        record_id = record.get("id")
        if isinstance(record_id, str):
            if record_id in seen_ids:
                errors.append(f"{record_id}: duplicate id")
            seen_ids.add(record_id)

        for error in validate_record(record):
            errors.append(f"{record_id or index}: {error}")

        question = record.get("question")
        split = record.get("split")
        if isinstance(question, str) and isinstance(split, str) and split in VALID_SPLITS:
            normalized = " ".join(question.lower().split())
            for other_split, questions in seen_questions_by_split.items():
                if other_split != split and normalized in questions:
                    errors.append(
                        f"{record_id or index}: question appears in both {other_split} and {split}"
                    )
            seen_questions_by_split[split].add(normalized)

    return errors

