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
from profile_qa.synthetic_data import (
    FOLLOW_UP_QA,
    MULTI_HOP_QA,
    TARGETED_COMPLETENESS_QA,
    build_records,
)
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
            ("recommendations", "recommendations_summary"),
            "followup-recommendation-traits-train-0",
        ),
    ],
)
def test_grouped_records_derive_answers_from_canonical_facts(
    monkeypatch: pytest.MonkeyPatch,
    fact_key: tuple[str, str],
    record_id: str,
) -> None:
    changed_text = f"Updated canonical fact for {record_id}."
    changed_fact = fact_index()[fact_key]
    monkeypatch.setitem(changed_fact, "text", changed_text)

    record = next(item for item in build_records(seed=7) if item["id"] == record_id)
    facts = fact_index()
    evidence_facts = [
        facts[(item["section_id"], item["fact_id"])] for item in record["evidence"]
    ]
    expected_answer = " ".join(str(fact["text"]) for fact in evidence_facts)
    assert record["answer"] == expected_answer
    assert changed_text in record["answer"]


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


def test_subject_aliases_preserve_short_names_inside_full_names(
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

    questions = {str(record["question"]) for record in build_records(seed=7)}

    assert "Where is Ada Lovelace based?" in questions
    assert "Where is the candidate Lovelace based?" not in questions
    assert "Where is this person Lovelace based?" not in questions
    assert "What location is listed for the candidate?" in questions


def test_subject_aliases_support_matching_full_and_short_names(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    custom_subject = {
        "name": "Prince",
        "shortName": "Prince",
        "subjectPronoun": "they",
        "objectPronoun": "them",
        "possessivePronoun": "their",
    }
    for key, value in custom_subject.items():
        monkeypatch.setitem(PROFILE_SUBJECT, key, value)

    questions = {str(record["question"]) for record in build_records(seed=7)}

    assert "What location is listed for the candidate?" in questions
    assert "What is the profile owner's current role?" in questions
    assert "Where is Prince based?" in questions


def test_subject_aliases_do_not_replace_colliding_pronoun_values(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    custom_subject = {
        "name": "Her Person",
        "shortName": "her",
        "subjectPronoun": "she",
        "objectPronoun": "her",
        "possessivePronoun": "her",
    }
    for key, value in custom_subject.items():
        monkeypatch.setitem(PROFILE_SUBJECT, key, value)

    questions = {str(record["question"]) for record in build_records(seed=7)}

    assert "Who employs the candidate in her current AI role?" in questions
    assert "Who employs this person in her current AI role?" in questions
    assert (
        "Who employs the candidate in the candidate current AI role?" not in questions
    )
    assert "Who employs this person in this person current AI role?" not in questions


def test_followup_operator_scores_only_the_workload_problem(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    record = next(
        item
        for item in build_records(seed=7)
        if item["id"] == "followup-operator-purpose-test-0"
    )

    assert record["expected_terms"] == ["failing workloads"]
    irrelevant_tool_list = "Codex packages, OpenInference, and a Kubernetes operator."
    assert score_answer(record, irrelevant_tool_list)["term"] == 0.0
    assert score_answer(record, str(record["answer"]))["term"] == 1.0

    fact = fact_index()[("projects", "projects_current_role")]
    term_groups = fact["termGroups"]
    assert isinstance(term_groups, dict)
    monkeypatch.setitem(term_groups, "operatorProblem", ["updated workload problem"])
    updated_record = next(
        item
        for item in build_records(seed=7)
        if item["id"] == "followup-operator-purpose-test-0"
    )
    assert updated_record["expected_terms"] == ["updated workload problem"]


def test_followup_graduate_schools_scores_only_institutions(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    record = next(
        item
        for item in build_records(seed=7)
        if item["id"] == "followup-graduate-schools-test-0"
    )

    assert record["expected_terms"] == ["Johns Hopkins", "Georgia Tech"]
    assert score_answer(record, "Johns Hopkins and Georgia Tech")["term"] == 1.0
    assert score_answer(record, "graduate CS")["term"] == 0.0

    fact = fact_index()[("education", "education_graduate")]
    term_groups = fact["termGroups"]
    assert isinstance(term_groups, dict)
    monkeypatch.setitem(
        term_groups,
        "graduateInstitutions",
        ["Updated University", "Another Institute"],
    )
    updated_record = next(
        item
        for item in build_records(seed=7)
        if item["id"] == "followup-graduate-schools-test-0"
    )
    assert updated_record["expected_terms"] == [
        "Updated University",
        "Another Institute",
    ]


@pytest.mark.parametrize(
    ("record_id", "expected_terms"),
    [
        (
            "targeted-current-impact-projects-train-0",
            [
                "33,000 users",
                "Codex packages",
                "OpenInference",
                "Kubernetes operator",
            ],
        ),
        (
            "targeted-rag-metrics-train-0",
            [
                "RAG",
                "shipyard operations",
                "MRR by 15%",
                "agentic retrieval by 38%",
            ],
        ),
        (
            "targeted-before-current-train-0",
            ["Defense Unicorns", "Air Force", "Space Force"],
        ),
        (
            "targeted-education-complete-train-0",
            [
                "B.S. in Mechanical Engineering",
                "Johns Hopkins",
                "Georgia Tech",
            ],
        ),
        (
            "current-impact-and-projects-train-0",
            [
                "11 organizations",
                "33,000 users",
                "Codex packages",
                "Kubernetes operator",
            ],
        ),
        (
            "previous-role-and-products-train-0",
            [
                "Senior Software Engineer",
                "Defense Unicorns",
                "LeapfrogAI",
                "UDS AI",
            ],
        ),
        (
            "rag-and-metrics-train-0",
            [
                "RAG",
                "shipyard operations",
                "MRR by 15%",
                "agentic retrieval by 38%",
            ],
        ),
        (
            "education-complete-train-0",
            [
                "B.S. in Mechanical Engineering",
                "Johns Hopkins",
                "Georgia Tech",
            ],
        ),
        (
            "experience-before-current-train-0",
            ["Defense Unicorns", "Air Force", "Space Force"],
        ),
        (
            "skills-and-recommendations-train-0",
            ["systems design", "AI/ML", "collaborative", "calm under pressure"],
        ),
        (
            "followup-defense-metrics-train-0",
            ["MRR by 15%", "agentic retrieval by 38%"],
        ),
        ("followup-operator-purpose-train-0", ["failing workloads"]),
        (
            "followup-graduate-schools-train-0",
            ["Johns Hopkins", "Georgia Tech"],
        ),
        (
            "followup-recommendation-traits-train-0",
            ["collaborative", "calm under pressure"],
        ),
    ],
)
def test_grouped_records_use_minimum_complete_scoring_terms(
    record_id: str,
    expected_terms: list[str],
) -> None:
    record = next(item for item in build_records(seed=7) if item["id"] == record_id)

    assert record["expected_terms"] == expected_terms
    assert score_answer(record, " ".join(expected_terms))["term"] == 1.0


@pytest.mark.parametrize(
    "record_id",
    [
        "targeted-rag-metrics-train-0",
        "rag-and-metrics-validation-0",
        "rag-and-metrics-test-0",
    ],
)
def test_rag_scoring_requires_a_distinguishing_project_detail(
    record_id: str,
) -> None:
    record = next(item for item in build_records(seed=7) if item["id"] == record_id)
    generic_rag_and_metrics = "RAG; MRR by 15%; agentic retrieval by 38%."
    identified_project_and_metrics = (
        "A RAG system for shipyard operations; MRR by 15%; agentic retrieval by 38%."
    )

    assert score_answer(record, generic_rag_and_metrics)["term"] < 1.0
    assert score_answer(record, identified_project_and_metrics)["term"] == 1.0


def test_every_grouped_record_derives_terms_from_named_canonical_groups(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    specs = TARGETED_COMPLETENESS_QA + MULTI_HOP_QA + FOLLOW_UP_QA
    facts = fact_index()
    mutated_groups: set[tuple[str, str, str]] = set()

    for spec in specs:
        term_groups = spec["term_groups"]
        assert isinstance(term_groups, dict)
        for evidence_key, group_name in term_groups.items():
            section_id, fact_id = str(evidence_key).split("/", maxsplit=1)
            group_key = (section_id, fact_id, str(group_name))
            if group_key in mutated_groups:
                continue
            mutated_groups.add(group_key)
            fact_term_groups = facts[(section_id, fact_id)]["termGroups"]
            assert isinstance(fact_term_groups, dict)
            monkeypatch.setitem(
                fact_term_groups,
                str(group_name),
                [f"mutated scoring term {len(mutated_groups)}"],
            )

    records_by_id = {str(record["id"]): record for record in build_records(seed=7)}
    for spec in specs:
        expected_terms: list[str] = []
        term_groups = spec["term_groups"]
        evidence = spec["evidence"]
        assert isinstance(term_groups, dict)
        assert isinstance(evidence, list)
        for item in evidence:
            assert isinstance(item, dict)
            section_id = str(item["section_id"])
            fact_id = str(item["fact_id"])
            evidence_key = f"{section_id}/{fact_id}"
            fact_term_groups = facts[(section_id, fact_id)]["termGroups"]
            assert isinstance(fact_term_groups, dict)
            selected_terms = fact_term_groups[str(term_groups[evidence_key])]
            assert isinstance(selected_terms, list)
            expected_terms.extend(str(term) for term in selected_terms)

        record = records_by_id[f"{spec['id']}-train-0"]
        assert record["expected_terms"] == expected_terms


def test_every_grouped_qa_requires_named_groups_for_all_evidence() -> None:
    specs = TARGETED_COMPLETENESS_QA + MULTI_HOP_QA + FOLLOW_UP_QA

    for spec in specs:
        evidence = spec["evidence"]
        assert isinstance(evidence, list)
        evidence_keys = {
            f"{item['section_id']}/{item['fact_id']}"
            for item in evidence
            if isinstance(item, dict)
        }
        assert spec.get("scoring") == "term_groups", spec["id"]
        term_groups = spec.get("term_groups")
        assert isinstance(term_groups, dict), spec["id"]
        assert set(term_groups) == evidence_keys, spec["id"]


def test_grouped_qa_rejects_broad_all_evidence_scoring(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    spec = TARGETED_COMPLETENESS_QA[0]
    monkeypatch.setitem(spec, "scoring", "all_evidence_terms")

    with pytest.raises(
        ValueError,
        match="targeted-current-impact-projects requires scoring=term_groups",
    ):
        build_records(seed=7)


def test_grouped_qa_rejects_an_incomplete_term_group_contract(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    spec = MULTI_HOP_QA[0]
    term_groups = spec["term_groups"]
    assert isinstance(term_groups, dict)
    monkeypatch.delitem(term_groups, "projects/projects_current_role")

    with pytest.raises(
        ValueError,
        match="current-impact-and-projects term_groups must select every evidence fact",
    ):
        build_records(seed=7)


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
