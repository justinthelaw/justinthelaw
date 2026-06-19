from __future__ import annotations

from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from profile_qa.public_profile import fact_index
from profile_qa.public_profile import PROFILE_SECTIONS
from profile_qa.synthetic_data import build_records
from profile_qa.validation import PRIVATE_DATA_MARKERS, validate_dataset


def test_generation_is_deterministic() -> None:
    assert build_records(seed=7) == build_records(seed=7)


def test_generated_records_match_schema() -> None:
    records = build_records(seed=7)

    assert validate_dataset(records) == []
    assert {record["split"] for record in records} == {"train", "validation", "test"}
    assert {record["task"] for record in records} >= {
        "single_turn",
        "multi_turn",
        "multi_hop",
        "chronology",
        "education",
        "recommendations",
        "refusal",
    }


def test_profile_sections_use_reusable_resume_ontology() -> None:
    section_ids = [str(section["id"]) for section in PROFILE_SECTIONS]

    assert section_ids == [
        "identity",
        "current_role",
        "experience",
        "projects",
        "education",
        "recommendations",
        "skills",
        "interests",
    ]
    assert "openai" not in section_ids
    assert "defense_unicorns" not in section_ids


def test_split_isolation_for_questions() -> None:
    questions_by_split: dict[str, set[str]] = {}
    for record in build_records(seed=7):
        split = str(record["split"])
        questions_by_split.setdefault(split, set()).add(str(record["question"]).lower())

    seen: set[str] = set()
    for questions in questions_by_split.values():
        assert seen.isdisjoint(questions)
        seen.update(questions)


def test_evidence_references_existing_public_facts() -> None:
    known_facts = fact_index()
    for record in build_records(seed=7):
        for evidence in record["evidence"]:
            key = (evidence["section_id"], evidence["fact_id"])
            assert key in known_facts


def test_non_refusal_answers_do_not_leak_private_data_markers() -> None:
    for record in build_records(seed=7):
        if record["requires_refusal"]:
            continue
        text = f"{record['question']} {record['answer']}".lower()
        leaked = [marker for marker in PRIVATE_DATA_MARKERS if marker in text]
        assert leaked == []
