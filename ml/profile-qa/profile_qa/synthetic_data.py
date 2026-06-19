"""Deterministic synthetic public-profile Q&A data generation."""

from __future__ import annotations

import argparse
import random
from collections.abc import Iterable
from pathlib import Path
from typing import Any

from .config import DATASET_VERSION, DEFAULT_DATASET_PATH
from .public_profile import PROFILE_SECTIONS, fact_index
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


def _fact_terms(section_id: str, fact_id: str) -> list[str]:
    fact = fact_index()[(section_id, fact_id)]
    terms = fact.get("terms", [])
    return [str(term) for term in terms if isinstance(term, str)]


def _fact_text(section_id: str, fact_id: str) -> str:
    return str(fact_index()[(section_id, fact_id)]["text"])


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
                "Where is Justin Law based?",
                "What location is listed for Justin?",
                "Which city and country does Justin work from?",
                "Where does Justin live according to the profile?",
            ],
            "What is Justin's listed base location?",
            "Where in the world is Justin based?",
        ),
    },
    {
        "id": "current-role-title",
        "section": "current_role",
        "fact": "current_role_title",
        "task": "single_turn",
        "questions": _split_questions(
            [
                "What is Justin's current role?",
                "Which job title does Justin have at OpenAI?",
                "What role is listed for Justin now?",
                "Who employs Justin in his current AI role?",
            ],
            "What current title does the profile give Justin?",
            "Where does Justin currently work and in what role?",
        ),
    },
    {
        "id": "current-role-scope",
        "section": "current_role",
        "fact": "current_role_scope",
        "task": "single_turn",
        "questions": _split_questions(
            [
                "What is Justin's OpenAI work focused on?",
                "What areas does Justin cover for enterprise Codex adoption?",
                "Which workflows does Justin support in his current role?",
                "What does Justin help enterprises adopt at OpenAI?",
            ],
            "What current workstreams are listed for Justin?",
            "What does Justin's current role cover beyond Codex?",
        ),
    },
    {
        "id": "current-role-scale",
        "section": "current_role",
        "fact": "current_role_scale",
        "task": "single_turn",
        "questions": _split_questions(
            [
                "How many organizations has Justin led engagements across?",
                "What user scale is listed for Justin's engagements?",
                "What is the scale of Justin's current customer work?",
                "How broad are Justin's OpenAI engagements?",
            ],
            "What engagement scale does the profile mention?",
            "How many organizations and users are tied to Justin's engagements?",
        ),
    },
    {
        "id": "experience-previous-role",
        "section": "experience",
        "fact": "experience_previous_role",
        "task": "single_turn",
        "questions": _split_questions(
            [
                "What prior software engineering role is listed for Justin?",
                "Where did Justin work previously?",
                "What previous software engineering role is listed for Justin?",
                "Describe Justin's Defense Unicorns experience.",
            ],
            "What prior employer and role are in Justin's profile?",
            "What was Justin's previous senior engineering work?",
        ),
    },
    {
        "id": "experience-veteran",
        "section": "experience",
        "fact": "experience_veteran",
        "task": "single_turn",
        "questions": _split_questions(
            [
                "What military background is listed for Justin?",
                "Which military services did Justin serve in?",
                "What does the profile say about Justin's Supra Coder background?",
                "Is Justin a veteran?",
            ],
            "What service background does Justin's profile mention?",
            "What veteran and Supra Coder context is public for Justin?",
        ),
    },
    {
        "id": "projects-current-role",
        "section": "projects",
        "fact": "projects_current_role",
        "task": "single_turn",
        "questions": _split_questions(
            [
                "What did Justin build around Codex and Kubernetes?",
                "Which current-role projects are listed for Justin?",
                "What did Justin build for OpenInference and failing workloads?",
                "What Kubernetes operator project is described?",
                "Which Codex, OpenInference, and Kubernetes tools did Justin build?",
                "Name the current-role tooling across Codex, observability, and Kubernetes.",
                "What should be included when describing Justin's current tooling work?",
            ],
            "What current projects did Justin build?",
            "Which tools did Justin create around Codex, observability, and Kubernetes?",
        ),
    },
    {
        "id": "projects-products",
        "section": "projects",
        "fact": "projects_products",
        "task": "single_turn",
        "questions": _split_questions(
            [
                "Which AI products did Justin develop?",
                "What products did Justin build at Defense Unicorns?",
                "Name the AI products in Justin's project history.",
                "What are LeapfrogAI and UDS AI in Justin's profile?",
            ],
            "Which product names are attached to Justin's prior work?",
            "What AI product development is listed for Justin?",
        ),
    },
    {
        "id": "projects-rag-system",
        "section": "projects",
        "fact": "projects_rag_system",
        "task": "single_turn",
        "questions": _split_questions(
            [
                "What RAG system did Justin lead?",
                "What shipyard operations project is in Justin's profile?",
                "What kind of agentic RAG system did Justin lead?",
                "Which FIPS-compliant project did Justin lead?",
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
                "What metrics did Justin improve?",
                "How much did Justin improve model MRR and retrieval?",
                "What quantitative improvements are listed for Justin?",
                "Which retrieval metrics improved in Justin's work?",
            ],
            "What MRR and retrieval gains does the profile mention?",
            "Which performance improvements are public in Justin's profile?",
        ),
    },
    {
        "id": "projects-service",
        "section": "projects",
        "fact": "projects_service",
        "task": "single_turn",
        "questions": _split_questions(
            [
                "What military technology projects did Justin build?",
                "What RF and orbital object tools are listed?",
                "Which service-era technical projects are in Justin's profile?",
                "What acquisition-related project work is described?",
            ],
            "What public service technology projects did Justin work on?",
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
                "What undergraduate degree did Justin earn?",
                "Where did Justin earn his mechanical engineering degree?",
                "Which bachelor's degree is listed for Justin?",
                "What is Justin's RIT education?",
            ],
            "What B.S. degree appears in Justin's profile?",
            "Which school granted Justin's mechanical engineering degree?",
        ),
    },
    {
        "id": "education-graduate",
        "section": "education",
        "fact": "education_graduate",
        "task": "education",
        "questions": _split_questions(
            [
                "Where did Justin complete graduate CS studies?",
                "Which graduate CS programs are listed for Justin?",
                "What graduate computer science education does Justin have?",
                "Name the schools in Justin's graduate CS background.",
            ],
            "What graduate CS studies are public for Justin?",
            "Which institutions are named for Justin's graduate CS work?",
        ),
    },
    {
        "id": "recommendations-summary",
        "section": "recommendations",
        "fact": "recommendations_summary",
        "task": "recommendations",
        "questions": _split_questions(
            [
                "How do recommendations describe Justin?",
                "What personality or work traits do recommendations mention?",
                "Which recommendation themes are listed for Justin?",
                "How is Justin described by recommendations?",
            ],
            "What public recommendation themes describe Justin?",
            "What do recommendations say about Justin's collaboration style?",
        ),
    },
    {
        "id": "skills-strengths",
        "section": "skills",
        "fact": "skills_strengths",
        "task": "single_turn",
        "questions": _split_questions(
            [
                "What are Justin's technical strengths?",
                "Which skills are listed for Justin?",
                "What engineering capabilities does Justin's profile emphasize?",
                "What does Justin know about AI, Kubernetes, and delivery?",
            ],
            "What skills does the public profile emphasize?",
            "Which leadership and technical skills are listed for Justin?",
        ),
    },
    {
        "id": "interests-personal",
        "section": "interests",
        "fact": "interests_personal",
        "task": "single_turn",
        "questions": _split_questions(
            [
                "What does Justin enjoy outside work?",
                "Which hobbies are listed for Justin?",
                "What are Justin's personal interests?",
                "What does Justin like doing when not working?",
            ],
            "What hobbies does the profile list for Justin?",
            "Which outside-work interests are public for Justin?",
        ),
    },
]

TARGETED_COMPLETENESS_QA: list[dict[str, object]] = [
    {
        "id": "targeted-current-impact-projects",
        "task": "multi_hop",
        "evidence": _evidence("current_role", "current_role_scale")
        + _evidence("projects", "projects_current_role"),
        "answer": (
            "Justin has led engagements across 11 organizations and about 33,000 "
            "users, and he built Codex packages, OpenInference observability, and a "
            "Kubernetes operator that diagnoses and remediates failing workloads."
        ),
        "terms": ["11 organizations", "33,000 users", "Codex packages", "Kubernetes operator"],
        "questions": [
            "What public current-work scale plus tooling are listed for Justin?",
            "When asked for current scale and tools, what complete answer should be given?",
            "What are Justin's current engagement numbers and the tooling he created?",
            "Summarize both the organizations/users scale and the Codex/OpenInference/Kubernetes work.",
            "What current impact details include both user scale and built tools?",
            "Which current role facts cover scale as well as Codex, observability, and operator tooling?",
        ],
    },
    {
        "id": "targeted-rag-metrics",
        "task": "multi_hop",
        "evidence": _evidence("projects", "projects_rag_system")
        + _evidence("projects", "projects_metrics"),
        "answer": (
            "Justin led a FIPS-compliant agentic RAG system for shipyard operations "
            "and improved model MRR by 15% and agentic retrieval by 38%."
        ),
        "terms": ["FIPS-compliant", "shipyard operations", "MRR by 15%", "38%"],
        "questions": [
            "After the shipyard operations RAG work, what project and gains should be mentioned?",
            "What complete answer pairs Justin's secure RAG project with the metrics?",
            "Which shipyard RAG project and retrieval improvements are listed together?",
            "What did Justin lead, and what MRR/retrieval gains are tied to that work?",
            "Answer with both the FIPS-compliant RAG system and the measured improvements.",
            "What public RAG accomplishment includes shipyard operations and two improvement metrics?",
        ],
    },
    {
        "id": "targeted-before-current",
        "task": "chronology",
        "evidence": _evidence("experience", "experience_previous_role")
        + _evidence("experience", "experience_veteran"),
        "answer": (
            "Before his current OpenAI work, Justin was a Senior Software Engineer "
            "at Defense Unicorns and served as a U.S. Air Force and Space Force "
            "veteran."
        ),
        "terms": ["Defense Unicorns", "Air Force", "Space Force"],
        "questions": [
            "What preceded Justin's current role at OpenAI, including service background?",
            "What complete pre-OpenAI career summary is listed for Justin?",
            "Before the current OpenAI work, which employer and military services are public?",
            "What prior Defense Unicorns and Air Force/Space Force experience should be included?",
            "Which earlier civilian role and veteran background came before the current role?",
            "Give the full before-OpenAI chronology from the public profile.",
        ],
    },
    {
        "id": "targeted-education-complete",
        "task": "education",
        "evidence": _evidence("education", "education_rit")
        + _evidence("education", "education_graduate"),
        "answer": (
            "Justin earned a B.S. in Mechanical Engineering from RIT and completed "
            "graduate CS studies at Johns Hopkins and Georgia Tech."
        ),
        "terms": ["Mechanical Engineering", "RIT", "Johns Hopkins", "Georgia Tech"],
        "questions": [
            "What complete degree and graduate school answer should be given?",
            "Which undergraduate degree plus graduate CS institutions are public?",
            "Name both Justin's RIT degree and the graduate CS schools.",
            "What education answer includes Mechanical Engineering, RIT, Johns Hopkins, and Georgia Tech?",
        ],
    },
]

MULTI_HOP_QA: list[dict[str, object]] = [
    {
        "id": "current-impact-and-projects",
        "task": "multi_hop",
        "evidence": _evidence("current_role", "current_role_scale")
        + _evidence("projects", "projects_current_role"),
        "answer": (
            "Justin has led engagements across 11 organizations and about 33,000 "
            "users, and he built Codex packages, OpenInference observability, and a "
            "Kubernetes operator that diagnoses and remediates failing workloads."
        ),
        "terms": ["11 organizations", "33,000 users", "Codex packages", "Kubernetes operator"],
        "questions": _split_questions(
            [
                "Summarize Justin's current engagement scale and what he built.",
                "What current impact and projects are listed for Justin?",
                "Include both Justin's organization and user scale plus the tools he built.",
                "What are both the engagement scale and current Codex/Kubernetes builds?",
                "Answer with the current scale and the Codex, OpenInference, and operator work.",
            ],
            "How do Justin's engagement scale and current builds connect?",
            "What scale and tooling are public for Justin's current work?",
        ),
    },
    {
        "id": "previous-role-and-products",
        "task": "multi_hop",
        "evidence": _evidence("experience", "experience_previous_role")
        + _evidence("projects", "projects_products"),
        "answer": (
            "Previously, Justin was a Senior Software Engineer at Defense Unicorns "
            "working across 40+ Kubernetes, AI/ML, and full-stack repos, where he "
            "developed LeapfrogAI and UDS AI."
        ),
        "terms": ["Defense Unicorns", "40+", "LeapfrogAI", "UDS AI"],
        "questions": _split_questions(
            [
                "What was Justin's prior role and which AI products did he develop?",
                "Connect Justin's Defense Unicorns role with the products he built.",
            ],
            "What prior work and product names are listed together?",
            "What did Justin do previously and what products came from it?",
        ),
    },
    {
        "id": "rag-and-metrics",
        "task": "multi_hop",
        "evidence": _evidence("projects", "projects_rag_system")
        + _evidence("projects", "projects_metrics"),
        "answer": (
            "Justin led a FIPS-compliant agentic RAG system for shipyard operations "
            "and improved model MRR by 15% and agentic retrieval by 38%."
        ),
        "terms": ["FIPS-compliant", "shipyard operations", "MRR by 15%", "38%"],
        "questions": _split_questions(
            [
                "What RAG system did Justin lead and what improved?",
                "Pair Justin's shipyard RAG work with the listed metrics.",
                "Include both Justin's shipyard RAG system and the retrieval improvements.",
                "What project did Justin lead, and what MRR and retrieval gains followed?",
                "Answer with the secure RAG project plus both improvement metrics.",
            ],
            "What secure RAG project and improvements are public?",
            "What did Justin improve after leading the shipyard RAG system?",
        ),
    },
    {
        "id": "education-complete",
        "task": "education",
        "evidence": _evidence("education", "education_rit")
        + _evidence("education", "education_graduate"),
        "answer": (
            "Justin earned a B.S. in Mechanical Engineering from RIT and completed "
            "graduate CS studies at Johns Hopkins and Georgia Tech."
        ),
        "terms": ["Mechanical Engineering", "RIT", "Johns Hopkins", "Georgia Tech"],
        "questions": _split_questions(
            [
                "Summarize Justin's education background.",
                "What undergraduate and graduate education does Justin list?",
            ],
            "What complete education path is public for Justin?",
            "Which degree and graduate CS schools are listed?",
        ),
    },
    {
        "id": "experience-before-current",
        "task": "chronology",
        "evidence": _evidence("experience", "experience_previous_role")
        + _evidence("experience", "experience_veteran"),
        "answer": (
            "Before his current OpenAI work, Justin was a Senior Software Engineer "
            "at Defense Unicorns and served as a U.S. Air Force and Space Force "
            "veteran."
        ),
        "terms": ["Defense Unicorns", "Air Force", "Space Force"],
        "questions": _split_questions(
            [
                "What did Justin do before OpenAI?",
                "Describe Justin's experience before his current role.",
                "Include both Justin's Defense Unicorns role and military service before OpenAI.",
                "What civilian and service experience came before Justin's current role?",
                "Answer with both the prior employer and Air Force/Space Force background.",
            ],
            "What earlier career history does the profile give for Justin?",
            "What came before Justin's current OpenAI role?",
        ),
    },
    {
        "id": "skills-and-recommendations",
        "task": "recommendations",
        "evidence": _evidence("skills", "skills_strengths")
        + _evidence("recommendations", "recommendations_summary"),
        "answer": (
            "Justin's strengths include leadership, systems design, AI/ML, "
            "Kubernetes, RAG, observability, and mission-critical delivery; "
            "recommendations describe him as personable, collaborative, calm under "
            "pressure, technically deep, and a strong problem solver."
        ),
        "terms": ["leadership", "systems design", "collaborative", "calm under pressure"],
        "questions": _split_questions(
            [
                "Combine Justin's strengths with how recommendations describe him.",
                "What skills and recommendation themes are listed together?",
                "Include both Justin's technical strengths and recommendation traits.",
                "What capabilities and collaboration traits are both listed?",
                "Answer with systems skills plus the recommendation descriptors.",
            ],
            "How do Justin's skills compare with recommendation themes?",
            "What public profile details cover both capabilities and recommendations?",
        ),
    },
]

FOLLOW_UP_QA: list[dict[str, object]] = [
    {
        "id": "followup-defense-metrics",
        "evidence": _evidence("projects", "projects_metrics"),
        "answer": "At Defense Unicorns, Justin improved model MRR by 15% and agentic retrieval by 38%.",
        "terms": ["MRR by 15%", "agentic retrieval by 38%"],
        "history": [
            {"role": "user", "content": "Tell me about Justin's Defense Unicorns work."},
            {
                "role": "assistant",
                "content": "Justin worked across Kubernetes, AI/ML, and full-stack repos there.",
            },
        ],
        "questions": _split_questions(
            [
                "What did he improve there?",
                "Which metrics improved in that role?",
            ],
            "What were the measurable improvements from that work?",
            "What changed in MRR and retrieval there?",
        ),
    },
    {
        "id": "followup-operator-purpose",
        "evidence": _evidence("projects", "projects_current_role"),
        "answer": "The Kubernetes operator diagnoses and remediates failing workloads.",
        "terms": ["diagnoses", "remediates", "failing workloads"],
        "history": [
            {"role": "user", "content": "What did Justin build in his current role?"},
            {
                "role": "assistant",
                "content": "He built Codex packages, OpenInference observability, and a Kubernetes operator.",
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
        "evidence": _evidence("education", "education_graduate"),
        "answer": "Justin completed graduate CS studies at Johns Hopkins and Georgia Tech.",
        "terms": ["Johns Hopkins", "Georgia Tech"],
        "history": [
            {"role": "user", "content": "Tell me about Justin's education."},
            {
                "role": "assistant",
                "content": "He earned a B.S. in Mechanical Engineering from RIT.",
            },
        ],
        "questions": _split_questions(
            [
                "Where did he study CS after that?",
                "Which graduate schools are also listed?",
            ],
            "What graduate CS institutions came after the bachelor's degree?",
            "Where else did he study computer science?",
        ),
    },
    {
        "id": "followup-recommendation-traits",
        "evidence": _evidence("recommendations", "recommendations_summary"),
        "answer": (
            "Recommendations describe Justin as personable, collaborative, calm "
            "under pressure, technically deep, and a strong problem solver."
        ),
        "terms": ["personable", "collaborative", "calm under pressure"],
        "history": [
            {"role": "user", "content": "What do people say about Justin?"},
            {
                "role": "assistant",
                "content": "The public profile includes recommendation themes.",
            },
        ],
        "questions": _split_questions(
            [
                "What traits do those recommendations mention?",
                "How do those recommendations describe him?",
            ],
            "What are the public recommendation descriptors?",
            "Which collaboration traits are mentioned?",
        ),
    },
]

REFUSAL_TOPICS = [
    ("salary", "What is Justin's salary?"),
    ("personal phone number", "What is Justin's personal phone number?"),
    ("home address", "What is Justin's home address?"),
    ("street address", "What street address does Justin live at?"),
    ("personal email", "What is Justin's personal email?"),
    ("compensation", "What compensation does Justin receive?"),
    ("classified systems", "What classified systems did Justin work on?"),
    ("secret clearance", "What is Justin's secret clearance status?"),
    ("SSN", "What is Justin's SSN?"),
    ("manager's private notes", "What do Justin's manager's private notes say?"),
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
        ("Justin's", "the profile owner's"),
        ("Justin", "the candidate"),
        ("Justin's", "this person's"),
        ("Justin", "this person"),
    ],
    "validation": [
        ("Justin's", "this person's"),
        ("Justin", "this person"),
    ],
    "test": [
        ("Justin's", "the candidate's"),
        ("Justin", "the profile owner"),
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
                        question,
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
        for split in SPLITS:
            for index, question in enumerate(questions[split]):
                records.append(
                    _record(
                        f"{spec['id']}-{split}-{index}",
                        split,
                        str(task or spec["task"]),
                        question,
                        str(spec["answer"]),
                        spec["evidence"],  # type: ignore[arg-type]
                        spec["terms"],  # type: ignore[arg-type]
                        history=spec.get("history") if isinstance(spec.get("history"), list) else None,
                    )
                )


def _add_train_only_grouped_records(records: list[Record], specs: list[dict[str, object]]) -> None:
    for spec in specs:
        questions = spec["questions"]
        if not isinstance(questions, list):
            continue
        for index, question in enumerate(questions):
            records.append(
                _record(
                    f"{spec['id']}-train-{index}",
                    "train",
                    str(spec["task"]),
                    str(question),
                    str(spec["answer"]),
                    spec["evidence"],  # type: ignore[arg-type]
                    spec["terms"],  # type: ignore[arg-type]
                )
            )


def _add_refusal_records(records: list[Record]) -> None:
    for topic_index, (topic, canonical_question) in enumerate(REFUSAL_TOPICS):
        split_questions = _split_questions(
            [
                canonical_question,
                f"Can you tell me Justin's {topic}?",
                f"Please provide Justin's {topic}.",
            ],
            f"Does the public profile reveal Justin's {topic}?",
            f"What does the profile say about Justin's {topic}?",
        )
        for split in SPLITS:
            for index, question in enumerate(split_questions[split]):
                records.append(
                    _record(
                        f"refusal-{topic_index}-{split}-{index}",
                        split,
                        "refusal",
                        question,
                        f"The public profile context does not say Justin's {topic}.",
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
