from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from profile_qa.evaluate import score_answer
from profile_qa.public_profile import (
    CANONICAL_PROFILE_PATH,
    PROFILE_SECTIONS,
    PROFILE_SUBJECT,
    fact_index,
)
from profile_qa.synthetic_data import build_records
from profile_qa.train_lora import format_instruction
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


def test_python_profile_loads_canonical_profile_source() -> None:
    canonical_sections = json.loads(CANONICAL_PROFILE_PATH.read_text(encoding="utf-8"))
    identity_section = next(
        section for section in canonical_sections if section["id"] == "identity"
    )

    assert PROFILE_SECTIONS == canonical_sections
    assert PROFILE_SUBJECT == identity_section["subject"]


def test_canonical_profile_preserves_browser_and_scoring_metadata() -> None:
    for section in PROFILE_SECTIONS:
        assert isinstance(section.get("priority"), int)
        assert isinstance(section.get("keywords"), list)
        assert section["keywords"]

        facts = section.get("facts")
        assert isinstance(facts, list)
        for fact in facts:
            assert isinstance(fact, dict)
            assert isinstance(fact.get("keywords"), list)
            assert fact["keywords"]
            assert isinstance(fact.get("terms"), list)
            assert fact["terms"]
            term_groups = fact.get("termGroups", {})
            assert isinstance(term_groups, dict)
            assert all(
                isinstance(name, str)
                and isinstance(terms, list)
                and terms
                and all(isinstance(term, str) for term in terms)
                for name, terms in term_groups.items()
            )


@pytest.mark.parametrize(
    ("fact_key", "record_id"),
    [
        (
            ("current_role", "current_role_scale"),
            "targeted-current-impact-projects-train-0",
        ),
        (("projects", "projects_rag_system"), "rag-and-metrics-train-0"),
        (
            ("education", "education_graduate"),
            "followup-graduate-schools-train-0",
        ),
    ],
)
def test_grouped_records_derive_answers_and_terms_from_canonical_facts(
    monkeypatch: pytest.MonkeyPatch,
    fact_key: tuple[str, str],
    record_id: str,
) -> None:
    changed_text = f"Updated canonical fact for {record_id}."
    changed_terms = [f"updated term for {record_id}"]
    changed_fact = fact_index()[fact_key]
    monkeypatch.setitem(changed_fact, "text", changed_text)
    monkeypatch.setitem(changed_fact, "terms", changed_terms)

    record = next(item for item in build_records(seed=7) if item["id"] == record_id)
    facts = fact_index()
    evidence_facts = [
        facts[(item["section_id"], item["fact_id"])] for item in record["evidence"]
    ]
    expected_answer = " ".join(str(fact["text"]) for fact in evidence_facts)
    expected_terms = list(
        dict.fromkeys(
            str(term)
            for fact in evidence_facts
            for term in fact.get("terms", [])
            if isinstance(term, str)
        )
    )

    assert record["answer"] == expected_answer
    assert record["expected_terms"] == expected_terms
    assert changed_text in record["answer"]
    assert changed_terms[0] in record["expected_terms"]


def test_custom_subject_renders_questions_histories_and_instruction(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    custom_subject = {
        "name": "Ada Lovelace",
        "shortName": "Ada",
        "subjectPronoun": "she",
        "objectPronoun": "her",
        "possessivePronoun": "her",
    }
    for key, value in custom_subject.items():
        monkeypatch.setitem(PROFILE_SUBJECT, key, value)

    records = build_records(seed=7)
    identity_record = next(
        record for record in records if record["id"] == "identity-location-train-0"
    )
    operator_record = next(
        record
        for record in records
        if record["id"] == "followup-operator-purpose-train-0"
    )
    refusal_record = next(
        record for record in records if record["id"] == "refusal-0-train-0"
    )

    assert identity_record["question"] == "Where is Ada Lovelace based?"
    assert operator_record["history"] == [
        {"role": "user", "content": "What did Ada build in her current role?"},
        {
            "role": "assistant",
            "content": (
                "She built Codex packages, OpenInference observability, and a "
                "Kubernetes operator."
            ),
        },
    ]
    assert refusal_record["question"] == "What is Ada's salary?"
    assert "Ada Lovelace's browser-only profile Q&A assistant" in format_instruction(
        identity_record
    )
    rendered_templates = " ".join(
        [str(record["question"]) for record in records]
        + [
            str(turn["content"])
            for record in records
            for turn in record.get("history", [])
        ]
    )
    assert "[[subject_" not in rendered_templates
    assert "[[object_" not in rendered_templates
    assert "[[possessive_" not in rendered_templates


def test_followup_operator_uses_purpose_specific_scoring_terms(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    record = next(
        item
        for item in build_records(seed=7)
        if item["id"] == "followup-operator-purpose-test-0"
    )

    assert record["expected_terms"] == [
        "diagnoses",
        "remediates",
        "failing workloads",
    ]
    irrelevant_tool_list = "Codex packages, OpenInference, and a Kubernetes operator."
    assert score_answer(record, irrelevant_tool_list)["term"] == 0.0
    assert score_answer(record, str(record["answer"]))["term"] == 1.0

    fact = fact_index()[("projects", "projects_current_role")]
    term_groups = fact["termGroups"]
    assert isinstance(term_groups, dict)
    monkeypatch.setitem(term_groups, "operatorPurpose", ["updated operator behavior"])
    updated_record = next(
        item
        for item in build_records(seed=7)
        if item["id"] == "followup-operator-purpose-test-0"
    )
    assert updated_record["expected_terms"] == ["updated operator behavior"]


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


def test_non_refusal_history_does_not_leak_private_data_markers() -> None:
    record = next(
        item.copy() for item in build_records(seed=7) if not item["requires_refusal"]
    )
    record["history"] = [
        {"role": "user", "content": "What is the personal email address?"}
    ]

    errors = validate_dataset([record])

    assert any("personal email" in error for error in errors)


def test_invalid_history_type_returns_validation_error() -> None:
    record = build_records(seed=7)[0].copy()
    record["history"] = None

    errors = validate_dataset([record])

    assert any("history must be a list when present" in error for error in errors)
