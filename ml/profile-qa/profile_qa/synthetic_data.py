"""Deterministic synthetic public-profile Q&A data generation."""

from __future__ import annotations

import argparse
import random
from collections.abc import Iterable
from pathlib import Path
from typing import Any

from .config import DATASET_VERSION, DEFAULT_DATASET_PATH
from .public_profile import (
    PROFILE_SECTIONS,
    fact_index,
    possessive,
    profile_subject_name,
    profile_subject_pronouns,
    profile_subject_short_name,
)
from .validation import validate_dataset, write_jsonl

Evidence = dict[str, str]
Record = dict[str, Any]
SplitQuestions = dict[str, list[str]]

SPLITS = ("train", "validation", "test")


def _evidence(section_id: str, *fact_ids: str) -> list[Evidence]:
    return [{"section_id": section_id, "fact_id": fact_id} for fact_id in fact_ids]


def _record(
    record_id: str,
    split: str,
    task: str,
    question: str,
    answer: str,
    evidence: list[Evidence],
    expected_terms: Iterable[str],
    *,
    requires_refusal: bool = False,
    history: list[dict[str, str]] | None = None,
) -> Record:
    return {
        "id": record_id,
        "split": split,
        "task": task,
        "question": question,
        "answer": answer,
        "evidence": evidence,
        "expected_terms": list(expected_terms),
        "requires_refusal": requires_refusal,
        "history": history or [],
        "source_profile_version": DATASET_VERSION,
    }


def _fact_terms(
    section_id: str,
    fact_id: str,
    term_group: str | None = None,
) -> list[str]:
    fact = fact_index()[(section_id, fact_id)]
    if term_group is None:
        terms = fact.get("terms", [])
    else:
        term_groups = fact.get("termGroups")
        if not isinstance(term_groups, dict) or term_group not in term_groups:
            raise ValueError(
                f"{section_id}/{fact_id} has no scoring term group {term_group}"
            )
        terms = term_groups[term_group]
    if not isinstance(terms, list):
        raise TypeError(f"{section_id}/{fact_id} scoring terms must be a list")
    return [str(term) for term in terms if isinstance(term, str)]


def _fact_text(section_id: str, fact_id: str) -> str:
    return str(fact_index()[(section_id, fact_id)]["text"])


def _answer_from_evidence(evidence: list[Evidence]) -> str:
    return " ".join(
        _fact_text(item["section_id"], item["fact_id"]) for item in evidence
    )


def _terms_from_evidence(
    evidence: list[Evidence],
    term_groups: dict[str, str] | None = None,
) -> list[str]:
    terms: list[str] = []
    for item in evidence:
        evidence_key = f"{item['section_id']}/{item['fact_id']}"
        term_group = term_groups.get(evidence_key) if term_groups else None
        for term in _fact_terms(
            item["section_id"], item["fact_id"], term_group=term_group
        ):
            if term not in terms:
                terms.append(term)
    return terms


def _grouped_evidence(spec: dict[str, object]) -> list[Evidence]:
    raw_evidence = spec["evidence"]
    if not isinstance(raw_evidence, list):
        raise TypeError(f"{spec['id']} evidence must be a list")

    evidence: list[Evidence] = []
    for item in raw_evidence:
        if not isinstance(item, dict):
            raise TypeError(f"{spec['id']} evidence entries must be objects")
        section_id = item.get("section_id")
        fact_id = item.get("fact_id")
        if not isinstance(section_id, str) or not isinstance(fact_id, str):
            raise TypeError(
                f"{spec['id']} evidence entries require string section_id and fact_id"
            )
        evidence.append({"section_id": section_id, "fact_id": fact_id})
    return evidence


def _grouped_term_groups(spec: dict[str, object]) -> dict[str, str]:
    raw_term_groups = spec.get("term_groups", {})
    if not isinstance(raw_term_groups, dict) or not all(
        isinstance(key, str) and isinstance(value, str)
        for key, value in raw_term_groups.items()
    ):
        raise TypeError(f"{spec['id']} term_groups must map evidence keys to names")
    return {str(key): str(value) for key, value in raw_term_groups.items()}


def _grouped_scoring_terms(
    spec: dict[str, object], evidence: list[Evidence]
) -> list[str]:
    scoring = spec.get("scoring")
    if scoring == "all_evidence_terms":
        if spec.get("term_groups"):
            raise ValueError(
                f"{spec['id']} cannot combine all_evidence_terms with term_groups"
            )
        return _terms_from_evidence(evidence)
    if scoring == "term_groups":
        term_groups = _grouped_term_groups(spec)
        evidence_keys = {
            f"{item['section_id']}/{item['fact_id']}" for item in evidence
        }
        if set(term_groups) != evidence_keys:
            raise ValueError(
                f"{spec['id']} term_groups must select every evidence fact"
            )
        return _terms_from_evidence(evidence, term_groups)
    raise ValueError(
        f"{spec['id']} requires scoring=all_evidence_terms or scoring=term_groups"
    )


def _render_profile_template(value: str) -> str:
    short_name = profile_subject_short_name()
    subject_pronoun, object_pronoun, possessive_pronoun = (
        profile_subject_pronouns()
    )
    replacements = {
        "[[subject_full]]": profile_subject_name(),
        "[[subject_possessive]]": possessive(short_name),
        "[[subject_short]]": short_name,
        "[[subject_pronoun]]": subject_pronoun,
        "[[subject_pronoun_capitalized]]": subject_pronoun.capitalize(),
        "[[object_pronoun]]": object_pronoun,
        "[[possessive_pronoun]]": possessive_pronoun,
    }
    rendered = value
    for token, replacement in replacements.items():
        rendered = rendered.replace(token, replacement)
    return rendered


def _render_history(value: object) -> list[dict[str, str]] | None:
    if not isinstance(value, list):
        return None
    history: list[dict[str, str]] = []
    for turn in value:
        if not isinstance(turn, dict):
            continue
        history.append(
            {
                "role": str(turn.get("role", "")),
                "content": _render_profile_template(str(turn.get("content", ""))),
            }
        )
    return history


def _split_questions(
    train: list[str],
    validation: str,
    test: str,
) -> SplitQuestions:
    return {
        "train": train,
        "validation": [validation],
        "test": [test],
    }


FACT_QA: list[dict[str, object]] = [
    {
        "id": "identity-location",
        "section": "identity",
        "fact": "identity_location",
        "task": "single_turn",
        "questions": _split_questions(
            [
                "Where is [[subject_full]] based?",
                "What location is listed for [[subject_short]]?",
                "Which city and country does [[subject_short]] work from?",
                "Where does [[subject_short]] live according to the profile?",
            ],
            "What is [[subject_possessive]] listed base location?",
            "Where in the world is [[subject_short]] based?",
        ),
    },
    {
        "id": "current-role-title",
        "section": "current_role",
        "fact": "current_role_title",
        "task": "single_turn",
        "questions": _split_questions(
            [
                "What is [[subject_possessive]] current role?",
                "Which job title does [[subject_short]] have at OpenAI?",
                "What role is listed for [[subject_short]] now?",
                "Who employs [[subject_short]] in [[possessive_pronoun]] current AI role?",
            ],
            "What current title does the profile give [[subject_short]]?",
            "Where does [[subject_short]] currently work and in what role?",
        ),
    },
    {
        "id": "current-role-scope",
        "section": "current_role",
        "fact": "current_role_scope",
        "task": "single_turn",
        "questions": _split_questions(
            [
                "What is [[subject_possessive]] OpenAI work focused on?",
                "What areas does [[subject_short]] cover for enterprise Codex adoption?",
                "Which workflows does [[subject_short]] support in [[possessive_pronoun]] current role?",
                "What does [[subject_short]] help enterprises adopt at OpenAI?",
            ],
            "What current workstreams are listed for [[subject_short]]?",
            "What does [[subject_possessive]] current role cover beyond Codex?",
        ),
    },
    {
        "id": "current-role-scale",
        "section": "current_role",
        "fact": "current_role_scale",
        "task": "single_turn",
        "questions": _split_questions(
            [
                "How many organizations has [[subject_short]] led engagements across?",
                "What user scale is listed for [[subject_possessive]] engagements?",
                "What is the scale of [[subject_possessive]] current customer work?",
                "How broad are [[subject_possessive]] OpenAI engagements?",
            ],
            "What engagement scale does the profile mention?",
            "How many organizations and users are tied to [[subject_possessive]] engagements?",
        ),
    },
    {
        "id": "experience-previous-role",
        "section": "experience",
        "fact": "experience_previous_role",
        "task": "single_turn",
        "questions": _split_questions(
            [
                "What prior software engineering role is listed for [[subject_short]]?",
                "Where did [[subject_short]] work previously?",
                "What previous software engineering role is listed for [[subject_short]]?",
                "Describe [[subject_possessive]] Defense Unicorns experience.",
            ],
            "What prior employer and role are in [[subject_possessive]] profile?",
            "What was [[subject_possessive]] previous senior engineering work?",
        ),
    },
    {
        "id": "experience-veteran",
        "section": "experience",
        "fact": "experience_veteran",
        "task": "single_turn",
        "questions": _split_questions(
            [
                "What military background is listed for [[subject_short]]?",
                "Which military services did [[subject_short]] serve in?",
                "What does the profile say about [[subject_possessive]] Supra Coder background?",
                "Is [[subject_short]] a veteran?",
            ],
            "What service background does [[subject_possessive]] profile mention?",
            "What veteran and Supra Coder context is public for [[subject_short]]?",
        ),
    },
    {
        "id": "projects-current-role",
        "section": "projects",
        "fact": "projects_current_role",
        "task": "single_turn",
        "questions": _split_questions(
            [
                "What did [[subject_short]] build around Codex and Kubernetes?",
                "Which current-role projects are listed for [[subject_short]]?",
                "What did [[subject_short]] build for OpenInference and failing workloads?",
                "What Kubernetes operator project is described?",
                "Which Codex, OpenInference, and Kubernetes tools did [[subject_short]] build?",
                "Name the current-role tooling across Codex, observability, and Kubernetes.",
                "What should be included when describing [[subject_possessive]] current tooling work?",
            ],
            "What current projects did [[subject_short]] build?",
            "Which tools did [[subject_short]] create around Codex, observability, and Kubernetes?",
        ),
    },
    {
        "id": "projects-products",
        "section": "projects",
        "fact": "projects_products",
        "task": "single_turn",
        "questions": _split_questions(
            [
                "Which AI products did [[subject_short]] develop?",
                "What products did [[subject_short]] build at Defense Unicorns?",
                "Name the AI products in [[subject_possessive]] project history.",
                "What are LeapfrogAI and UDS AI in [[subject_possessive]] profile?",
            ],
            "Which product names are attached to [[subject_possessive]] prior work?",
            "What AI product development is listed for [[subject_short]]?",
        ),
    },
    {
        "id": "projects-rag-system",
        "section": "projects",
        "fact": "projects_rag_system",
        "task": "single_turn",
        "questions": _split_questions(
            [
                "What RAG system did [[subject_short]] lead?",
                "What shipyard operations project is in [[subject_possessive]] profile?",
                "What kind of agentic RAG system did [[subject_short]] lead?",
                "Which FIPS-compliant project did [[subject_short]] lead?",
            ],
            "What secure RAG project does the profile describe?",
            "What project connected agentic RAG with shipyard operations?",
        ),
    },
    {
        "id": "projects-metrics",
        "section": "projects",
        "fact": "projects_metrics",
        "task": "single_turn",
        "questions": _split_questions(
            [
                "What metrics did [[subject_short]] improve?",
                "How much did [[subject_short]] improve model MRR and retrieval?",
                "What quantitative improvements are listed for [[subject_short]]?",
                "Which retrieval metrics improved in [[subject_possessive]] work?",
            ],
            "What MRR and retrieval gains does the profile mention?",
            "Which performance improvements are public in [[subject_possessive]] profile?",
        ),
    },
    {
        "id": "projects-service",
        "section": "projects",
        "fact": "projects_service",
        "task": "single_turn",
        "questions": _split_questions(
            [
                "What military technology projects did [[subject_short]] build?",
                "What RF and orbital object tools are listed?",
                "Which service-era technical projects are in [[subject_possessive]] profile?",
                "What acquisition-related project work is described?",
            ],
            "What public service technology projects did [[subject_short]] work on?",
            "Which RF, orbital, and acquisition projects are listed?",
        ),
    },
    {
        "id": "education-rit",
        "section": "education",
        "fact": "education_rit",
        "task": "education",
        "questions": _split_questions(
            [
                "What undergraduate degree did [[subject_short]] earn?",
                "Where did [[subject_short]] earn [[possessive_pronoun]] mechanical engineering degree?",
                "Which bachelor's degree is listed for [[subject_short]]?",
                "What is [[subject_possessive]] RIT education?",
            ],
            "What B.S. degree appears in [[subject_possessive]] profile?",
            "Which school granted [[subject_possessive]] mechanical engineering degree?",
        ),
    },
    {
        "id": "education-graduate",
        "section": "education",
        "fact": "education_graduate",
        "task": "education",
        "questions": _split_questions(
            [
                "Where did [[subject_short]] complete graduate CS studies?",
                "Which graduate CS programs are listed for [[subject_short]]?",
                "What graduate computer science education does [[subject_short]] have?",
                "Name the schools in [[subject_possessive]] graduate CS background.",
            ],
            "What graduate CS studies are public for [[subject_short]]?",
            "Which institutions are named for [[subject_possessive]] graduate CS work?",
        ),
    },
    {
        "id": "recommendations-summary",
        "section": "recommendations",
        "fact": "recommendations_summary",
        "task": "recommendations",
        "questions": _split_questions(
            [
                "How do recommendations describe [[subject_short]]?",
                "What personality or work traits do recommendations mention?",
                "Which recommendation themes are listed for [[subject_short]]?",
                "How is [[subject_short]] described by recommendations?",
            ],
            "What public recommendation themes describe [[subject_short]]?",
            "What do recommendations say about [[subject_possessive]] collaboration style?",
        ),
    },
    {
        "id": "skills-strengths",
        "section": "skills",
        "fact": "skills_strengths",
        "task": "single_turn",
        "questions": _split_questions(
            [
                "What are [[subject_possessive]] technical strengths?",
                "Which skills are listed for [[subject_short]]?",
                "What engineering capabilities does [[subject_possessive]] profile emphasize?",
                "What does [[subject_short]] know about AI, Kubernetes, and delivery?",
            ],
            "What skills does the public profile emphasize?",
            "Which leadership and technical skills are listed for [[subject_short]]?",
        ),
    },
    {
        "id": "interests-personal",
        "section": "interests",
        "fact": "interests_personal",
        "task": "single_turn",
        "questions": _split_questions(
            [
                "What does [[subject_short]] enjoy outside work?",
                "Which hobbies are listed for [[subject_short]]?",
                "What are [[subject_possessive]] personal interests?",
                "What does [[subject_short]] like doing when not working?",
            ],
            "What hobbies does the profile list for [[subject_short]]?",
            "Which outside-work interests are public for [[subject_short]]?",
        ),
    },
]

TARGETED_COMPLETENESS_QA: list[dict[str, object]] = [
    {
        "id": "targeted-current-impact-projects",
        "task": "multi_hop",
        "scoring": "all_evidence_terms",
        "evidence": _evidence("current_role", "current_role_scale")
        + _evidence("projects", "projects_current_role"),
        "questions": [
            "What public current-work scale plus tooling are listed for [[subject_short]]?",
            "When asked for current scale and tools, what complete answer should be given?",
            "What are [[subject_possessive]] current engagement numbers and the tooling [[subject_pronoun]] created?",
            "Summarize both the organizations/users scale and the Codex/OpenInference/Kubernetes work.",
            "What current impact details include both user scale and built tools?",
            "Which current role facts cover scale as well as Codex, observability, and operator tooling?",
        ],
    },
    {
        "id": "targeted-rag-metrics",
        "task": "multi_hop",
        "scoring": "all_evidence_terms",
        "evidence": _evidence("projects", "projects_rag_system")
        + _evidence("projects", "projects_metrics"),
        "questions": [
            "After the shipyard operations RAG work, what project and gains should be mentioned?",
            "What complete answer pairs [[subject_possessive]] secure RAG project with the metrics?",
            "Which shipyard RAG project and retrieval improvements are listed together?",
            "What did [[subject_short]] lead, and what MRR/retrieval gains are tied to that work?",
            "Answer with both the FIPS-compliant RAG system and the measured improvements.",
            "What public RAG accomplishment includes shipyard operations and two improvement metrics?",
        ],
    },
    {
        "id": "targeted-before-current",
        "task": "chronology",
        "scoring": "all_evidence_terms",
        "evidence": _evidence("experience", "experience_previous_role")
        + _evidence("experience", "experience_veteran"),
        "questions": [
            "What preceded [[subject_possessive]] current role at OpenAI, including service background?",
            "What complete pre-OpenAI career summary is listed for [[subject_short]]?",
            "Before the current OpenAI work, which employer and military services are public?",
            "What prior Defense Unicorns and Air Force/Space Force experience should be included?",
            "Which earlier civilian role and veteran background came before the current role?",
            "Give the full before-OpenAI chronology from the public profile.",
        ],
    },
    {
        "id": "targeted-education-complete",
        "task": "education",
        "scoring": "all_evidence_terms",
        "evidence": _evidence("education", "education_rit")
        + _evidence("education", "education_graduate"),
        "questions": [
            "What complete degree and graduate school answer should be given?",
            "Which undergraduate degree plus graduate CS institutions are public?",
            "Name both [[subject_possessive]] RIT degree and the graduate CS schools.",
            "What education answer includes Mechanical Engineering, RIT, Johns Hopkins, and Georgia Tech?",
        ],
    },
]

MULTI_HOP_QA: list[dict[str, object]] = [
    {
        "id": "current-impact-and-projects",
        "task": "multi_hop",
        "scoring": "all_evidence_terms",
        "evidence": _evidence("current_role", "current_role_scale")
        + _evidence("projects", "projects_current_role"),
        "questions": _split_questions(
            [
                "Summarize [[subject_possessive]] current engagement scale and what [[subject_pronoun]] built.",
                "What current impact and projects are listed for [[subject_short]]?",
                "Include both [[subject_possessive]] organization and user scale plus the tools [[subject_pronoun]] built.",
                "What are both the engagement scale and current Codex/Kubernetes builds?",
                "Answer with the current scale and the Codex, OpenInference, and operator work.",
            ],
            "How do [[subject_possessive]] engagement scale and current builds connect?",
            "What scale and tooling are public for [[subject_possessive]] current work?",
        ),
    },
    {
        "id": "previous-role-and-products",
        "task": "multi_hop",
        "scoring": "all_evidence_terms",
        "evidence": _evidence("experience", "experience_previous_role")
        + _evidence("projects", "projects_products"),
        "questions": _split_questions(
            [
                "What was [[subject_possessive]] prior role and which AI products did [[subject_pronoun]] develop?",
                "Connect [[subject_possessive]] Defense Unicorns role with the products [[subject_pronoun]] built.",
            ],
            "What prior work and product names are listed together?",
            "What did [[subject_short]] do previously and what products came from it?",
        ),
    },
    {
        "id": "rag-and-metrics",
        "task": "multi_hop",
        "scoring": "all_evidence_terms",
        "evidence": _evidence("projects", "projects_rag_system")
        + _evidence("projects", "projects_metrics"),
        "questions": _split_questions(
            [
                "What RAG system did [[subject_short]] lead and what improved?",
                "Pair [[subject_possessive]] shipyard RAG work with the listed metrics.",
                "Include both [[subject_possessive]] shipyard RAG system and the retrieval improvements.",
                "What project did [[subject_short]] lead, and what MRR and retrieval gains followed?",
                "Answer with the secure RAG project plus both improvement metrics.",
            ],
            "What secure RAG project and improvements are public?",
            "What did [[subject_short]] improve after leading the shipyard RAG system?",
        ),
    },
    {
        "id": "education-complete",
        "task": "education",
        "scoring": "all_evidence_terms",
        "evidence": _evidence("education", "education_rit")
        + _evidence("education", "education_graduate"),
        "questions": _split_questions(
            [
                "Summarize [[subject_possessive]] education background.",
                "What undergraduate and graduate education does [[subject_short]] list?",
            ],
            "What complete education path is public for [[subject_short]]?",
            "Which degree and graduate CS schools are listed?",
        ),
    },
    {
        "id": "experience-before-current",
        "task": "chronology",
        "scoring": "all_evidence_terms",
        "evidence": _evidence("experience", "experience_previous_role")
        + _evidence("experience", "experience_veteran"),
        "questions": _split_questions(
            [
                "What did [[subject_short]] do before OpenAI?",
                "Describe [[subject_possessive]] experience before [[possessive_pronoun]] current role.",
                "Include both [[subject_possessive]] Defense Unicorns role and military service before OpenAI.",
                "What civilian and service experience came before [[subject_possessive]] current role?",
                "Answer with both the prior employer and Air Force/Space Force background.",
            ],
            "What earlier career history does the profile give for [[subject_short]]?",
            "What came before [[subject_possessive]] current OpenAI role?",
        ),
    },
    {
        "id": "skills-and-recommendations",
        "task": "recommendations",
        "scoring": "all_evidence_terms",
        "evidence": _evidence("skills", "skills_strengths")
        + _evidence("recommendations", "recommendations_summary"),
        "questions": _split_questions(
            [
                "Combine [[subject_possessive]] strengths with how recommendations describe [[object_pronoun]].",
                "What skills and recommendation themes are listed together?",
                "Include both [[subject_possessive]] technical strengths and recommendation traits.",
                "What capabilities and collaboration traits are both listed?",
                "Answer with systems skills plus the recommendation descriptors.",
            ],
            "How do [[subject_possessive]] skills compare with recommendation themes?",
            "What public profile details cover both capabilities and recommendations?",
        ),
    },
]

FOLLOW_UP_QA: list[dict[str, object]] = [
    {
        "id": "followup-defense-metrics",
        "scoring": "all_evidence_terms",
        "evidence": _evidence("projects", "projects_metrics"),
        "history": [
            {"role": "user", "content": "Tell me about [[subject_possessive]] Defense Unicorns work."},
            {
                "role": "assistant",
                "content": "[[subject_short]] worked across Kubernetes, AI/ML, and full-stack repos there.",
            },
        ],
        "questions": _split_questions(
            [
                "What did [[subject_pronoun]] improve there?",
                "Which metrics improved in that role?",
            ],
            "What were the measurable improvements from that work?",
            "What changed in MRR and retrieval there?",
        ),
    },
    {
        "id": "followup-operator-purpose",
        "scoring": "term_groups",
        "evidence": _evidence("projects", "projects_current_role"),
        "term_groups": {
            "projects/projects_current_role": "operatorPurpose",
        },
        "history": [
            {"role": "user", "content": "What did [[subject_short]] build in [[possessive_pronoun]] current role?"},
            {
                "role": "assistant",
                "content": "[[subject_pronoun_capitalized]] built Codex packages, OpenInference observability, and a Kubernetes operator.",
            },
        ],
        "questions": _split_questions(
            [
                "What did that operator do?",
                "What problem did the operator handle?",
            ],
            "How did that Kubernetes operator help?",
            "What workload issue did that operator address?",
        ),
    },
    {
        "id": "followup-graduate-schools",
        "scoring": "term_groups",
        "evidence": _evidence("education", "education_graduate"),
        "term_groups": {
            "education/education_graduate": "graduateInstitutions",
        },
        "history": [
            {"role": "user", "content": "Tell me about [[subject_possessive]] education."},
            {
                "role": "assistant",
                "content": "[[subject_pronoun_capitalized]] earned a B.S. in Mechanical Engineering from RIT.",
            },
        ],
        "questions": _split_questions(
            [
                "Where did [[subject_pronoun]] study CS after that?",
                "Which graduate schools are also listed?",
            ],
            "What graduate CS institutions came after the bachelor's degree?",
            "Where else did [[subject_pronoun]] study computer science?",
        ),
    },
    {
        "id": "followup-recommendation-traits",
        "scoring": "all_evidence_terms",
        "evidence": _evidence("recommendations", "recommendations_summary"),
        "history": [
            {"role": "user", "content": "What do people say about [[subject_short]]?"},
            {
                "role": "assistant",
                "content": "The public profile includes recommendation themes.",
            },
        ],
        "questions": _split_questions(
            [
                "What traits do those recommendations mention?",
                "How do those recommendations describe [[object_pronoun]]?",
            ],
            "What are the public recommendation descriptors?",
            "Which collaboration traits are mentioned?",
        ),
    },
]

REFUSAL_TOPICS = [
    ("salary", "What is [[subject_possessive]] salary?"),
    ("personal phone number", "What is [[subject_possessive]] personal phone number?"),
    ("home address", "What is [[subject_possessive]] home address?"),
    ("street address", "What street address does [[subject_short]] live at?"),
    ("personal email", "What is [[subject_possessive]] personal email?"),
    ("compensation", "What compensation does [[subject_short]] receive?"),
    ("classified systems", "What classified systems did [[subject_short]] work on?"),
    ("secret clearance", "What is [[subject_possessive]] secret clearance status?"),
    ("SSN", "What is [[subject_possessive]] SSN?"),
    ("manager's private notes", "What do [[subject_possessive]] manager's private notes say?"),
]

SECTION_SUMMARY_QUESTIONS = {
    "train": [
        "Summarize the {section} section.",
        "What does the profile say under {section}?",
        "Give the candidate's {section} details.",
    ],
    "validation": [
        "Which {section} details are listed for this person?",
    ],
    "test": [
        "What should I know from the {section} section?",
    ],
}

PROFILE_SUBJECT_ALIASES = {
    "train": [
        ("[[subject_possessive]]", "the profile owner's"),
        ("[[subject_short]]", "the candidate"),
        ("[[subject_possessive]]", "this person's"),
        ("[[subject_short]]", "this person"),
    ],
    "validation": [
        ("[[subject_possessive]]", "this person's"),
        ("[[subject_short]]", "this person"),
    ],
    "test": [
        ("[[subject_possessive]]", "the candidate's"),
        ("[[subject_short]]", "the profile owner"),
    ],
}

SECTION_TASKS = {
    "experience": "chronology",
    "education": "education",
    "recommendations": "recommendations",
}


def _add_fact_records(records: list[Record]) -> None:
    for spec in FACT_QA:
        section_id = str(spec["section"])
        fact_id = str(spec["fact"])
        answer = _fact_text(section_id, fact_id)
        evidence = _evidence(section_id, fact_id)
        terms = _fact_terms(section_id, fact_id)
        questions = spec["questions"]
        if not isinstance(questions, dict):
            continue
        for split in SPLITS:
            for index, question in enumerate(questions[split]):
                records.append(
                    _record(
                        f"{spec['id']}-{split}-{index}",
                        split,
                        str(spec["task"]),
                        _render_profile_template(question),
                        answer,
                        evidence,
                        terms,
                    )
                )


def _add_grouped_records(records: list[Record], specs: list[dict[str, object]], task: str | None = None) -> None:
    for spec in specs:
        questions = spec["questions"]
        if not isinstance(questions, dict):
            continue
        evidence = _grouped_evidence(spec)
        answer = _answer_from_evidence(evidence)
        terms = _grouped_scoring_terms(spec, evidence)
        for split in SPLITS:
            for index, question in enumerate(questions[split]):
                records.append(
                    _record(
                        f"{spec['id']}-{split}-{index}",
                        split,
                        str(task or spec["task"]),
                        _render_profile_template(question),
                        answer,
                        evidence,
                        terms,
                        history=_render_history(spec.get("history")),
                    )
                )


def _add_train_only_grouped_records(records: list[Record], specs: list[dict[str, object]]) -> None:
    for spec in specs:
        questions = spec["questions"]
        if not isinstance(questions, list):
            continue
        evidence = _grouped_evidence(spec)
        answer = _answer_from_evidence(evidence)
        terms = _grouped_scoring_terms(spec, evidence)
        for index, question in enumerate(questions):
            records.append(
                _record(
                    f"{spec['id']}-train-{index}",
                    "train",
                    str(spec["task"]),
                    _render_profile_template(str(question)),
                    answer,
                    evidence,
                    terms,
                )
            )


def _add_refusal_records(records: list[Record]) -> None:
    for topic_index, (topic, canonical_question) in enumerate(REFUSAL_TOPICS):
        split_questions = _split_questions(
            [
                canonical_question,
                f"Can you tell me [[subject_possessive]] {topic}?",
                f"Please provide [[subject_possessive]] {topic}.",
            ],
            f"Does the public profile reveal [[subject_possessive]] {topic}?",
            f"What does the profile say about [[subject_possessive]] {topic}?",
        )
        for split in SPLITS:
            for index, question in enumerate(split_questions[split]):
                records.append(
                    _record(
                        f"refusal-{topic_index}-{split}-{index}",
                        split,
                        "refusal",
                        _render_profile_template(question),
                        _render_profile_template(
                            f"The public profile context does not say "
                            f"[[subject_possessive]] {topic}."
                        ),
                        [],
                        [],
                        requires_refusal=True,
                    )
                )


def _section_task(section_id: str) -> str:
    return SECTION_TASKS.get(section_id, "single_turn")


def _section_evidence(section: dict[str, object]) -> list[Evidence]:
    section_id = str(section["id"])
    facts = section["facts"]
    if not isinstance(facts, list):
        return []
    return [
        {"section_id": section_id, "fact_id": str(fact["id"])}
        for fact in facts
        if isinstance(fact, dict)
    ]


def _section_answer(section: dict[str, object]) -> str:
    facts = section["facts"]
    if not isinstance(facts, list):
        return ""
    return " ".join(str(fact["text"]) for fact in facts if isinstance(fact, dict))


def _section_terms(section: dict[str, object]) -> list[str]:
    terms: list[str] = []
    facts = section["facts"]
    if not isinstance(facts, list):
        return terms
    for fact in facts:
        if not isinstance(fact, dict):
            continue
        for term in fact.get("terms", []):
            if isinstance(term, str) and term not in terms:
                terms.append(term)
    return terms


def _add_section_summary_records(records: list[Record]) -> None:
    for section in PROFILE_SECTIONS:
        section_id = str(section["id"])
        section_title = str(section["title"]).lower()
        answer = _section_answer(section)
        evidence = _section_evidence(section)
        terms = _section_terms(section)
        if not answer or not evidence:
            continue
        for split in SPLITS:
            for index, template in enumerate(SECTION_SUMMARY_QUESTIONS[split]):
                question = template.format(section=section_title)
                records.append(
                    _record(
                        f"section-summary-{section_id}-{split}-{index}",
                        split,
                        _section_task(section_id),
                        question,
                        answer,
                        evidence,
                        terms,
                    )
                )


def _replace_profile_subject(question: str, split: str) -> list[str]:
    variants: list[str] = []
    for source, replacement in PROFILE_SUBJECT_ALIASES[split]:
        source = _render_profile_template(source)
        if source not in question:
            continue
        replaced = question.replace(source, replacement)
        if replaced != question and replaced not in variants:
            variants.append(replaced)
    return variants


def _add_profile_subject_alias_records(records: list[Record]) -> None:
    normalized_questions = {" ".join(str(record["question"]).lower().split()) for record in records}
    source_records = list(records)
    for record in source_records:
        split = str(record["split"])
        for index, question in enumerate(_replace_profile_subject(str(record["question"]), split)):
            normalized = " ".join(question.lower().split())
            if normalized in normalized_questions:
                continue
            normalized_questions.add(normalized)
            records.append(
                _record(
                    f"{record['id']}-subject-alias-{index}",
                    split,
                    str(record["task"]),
                    question,
                    str(record["answer"]),
                    list(record["evidence"]),
                    list(record.get("expected_terms", [])),
                    requires_refusal=bool(record["requires_refusal"]),
                    history=list(record.get("history", [])),
                )
            )


def build_records(seed: int = 7) -> list[Record]:
    """Build a deterministic dataset from public profile facts."""

    records: list[Record] = []
    _add_fact_records(records)
    _add_grouped_records(records, MULTI_HOP_QA)
    _add_grouped_records(records, FOLLOW_UP_QA, task="multi_turn")
    _add_refusal_records(records)
    _add_section_summary_records(records)
    _add_train_only_grouped_records(records, TARGETED_COMPLETENESS_QA)
    _add_profile_subject_alias_records(records)

    rng = random.Random(seed)
    rng.shuffle(records)
    return records


def profile_context_text() -> str:
    """Return the public profile as a plain text context block."""

    lines: list[str] = []
    for section in PROFILE_SECTIONS:
        title = str(section["title"])
        facts = section["facts"]
        if not isinstance(facts, list):
            continue
        fact_texts = [str(fact["text"]) for fact in facts if isinstance(fact, dict)]
        lines.append(f"{title}: {' '.join(fact_texts)}")
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default=str(DEFAULT_DATASET_PATH))
    parser.add_argument("--seed", type=int, default=7)
    args = parser.parse_args()

    records = build_records(seed=args.seed)
    errors = validate_dataset(records)
    if errors:
        for error in errors:
            print(error)
        return 1

    write_jsonl(Path(args.output), records)
    split_counts = {split: sum(1 for record in records if record["split"] == split) for split in SPLITS}
    print(f"wrote {len(records)} records to {args.output} ({split_counts})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
