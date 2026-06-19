"""Public profile facts used for deterministic synthetic data generation."""

from __future__ import annotations

from typing import Final

ProfileFact = dict[str, object]
ProfileSection = dict[str, object]

PROFILE_SECTIONS: Final[list[ProfileSection]] = [
    {
        "id": "identity",
        "title": "Identity",
        "always_include": True,
        "keywords": ["name", "identity", "location", "based", "who"],
        "facts": [
            {
                "id": "identity_location",
                "text": "Justin Law is based in New York, USA.",
                "terms": ["New York", "USA"],
            },
        ],
    },
    {
        "id": "current_role",
        "title": "Current Role",
        "keywords": [
            "current role",
            "current job",
            "current work",
            "employer",
            "role",
            "scope",
            "impact",
        ],
        "facts": [
            {
                "id": "current_role_title",
                "text": "At OpenAI, Justin is an AI Deployment Engineer.",
                "terms": ["AI Deployment Engineer", "OpenAI"],
            },
            {
                "id": "current_role_scope",
                "text": (
                    "Justin focuses on enterprise Codex adoption across CLI, SDK, "
                    "MCP, app-server, observability, Kubernetes, and full-stack "
                    "workflows."
                ),
                "terms": ["enterprise Codex adoption", "CLI", "SDK", "MCP"],
            },
            {
                "id": "current_role_scale",
                "text": (
                    "He has led engagements across 11 organizations and about "
                    "33,000 users."
                ),
                "terms": ["11 organizations", "33,000 users"],
            },
        ],
    },
    {
        "id": "experience",
        "title": "Experience",
        "keywords": [
            "experience",
            "previous role",
            "work history",
            "chronology",
            "before",
            "veteran",
            "career",
        ],
        "facts": [
            {
                "id": "experience_previous_role",
                "text": (
                    "Previously, Justin was a Senior Software Engineer at Defense "
                    "Unicorns, working across 40+ Kubernetes, AI/ML, and full-stack "
                    "repos."
                ),
                "terms": ["Senior Software Engineer", "Defense Unicorns", "40+"],
            },
            {
                "id": "experience_veteran",
                "text": (
                    "Justin is a U.S. Air Force and Space Force veteran and one of "
                    "the Space Force's first certified Supra Coders."
                ),
                "terms": ["Air Force", "Space Force", "Supra Coders"],
            },
        ],
    },
    {
        "id": "projects",
        "title": "Projects",
        "keywords": [
            "project",
            "projects",
            "built",
            "developed",
            "operator",
            "product",
            "tool",
            "rag",
            "metrics",
        ],
        "facts": [
            {
                "id": "projects_current_role",
                "text": (
                    "He built Codex packages, OpenInference observability, and a "
                    "Kubernetes operator that diagnoses and remediates failing "
                    "workloads."
                ),
                "terms": ["Codex packages", "OpenInference", "Kubernetes operator"],
            },
            {
                "id": "projects_products",
                "text": "He developed LeapfrogAI and UDS AI.",
                "terms": ["LeapfrogAI", "UDS AI"],
            },
            {
                "id": "projects_rag_system",
                "text": (
                    "He led a FIPS-compliant agentic RAG system for shipyard "
                    "operations."
                ),
                "terms": ["FIPS-compliant", "agentic RAG", "shipyard operations"],
            },
            {
                "id": "projects_metrics",
                "text": (
                    "His work improved model MRR by 15% and agentic retrieval by "
                    "38%."
                ),
                "terms": ["MRR by 15%", "agentic retrieval by 38%"],
            },
            {
                "id": "projects_service",
                "text": (
                    "He built RF deconfliction tools, orbital object OSINT apps, "
                    "and acquisition strategies."
                ),
                "terms": ["RF deconfliction", "orbital object OSINT", "acquisition"],
            },
        ],
    },
    {
        "id": "education",
        "title": "Education",
        "keywords": [
            "education",
            "degree",
            "mechanical engineering",
            "rit",
            "johns hopkins",
            "georgia tech",
            "graduate",
        ],
        "facts": [
            {
                "id": "education_rit",
                "text": "Justin earned a B.S. in Mechanical Engineering from RIT.",
                "terms": ["B.S. in Mechanical Engineering", "RIT"],
            },
            {
                "id": "education_graduate",
                "text": (
                    "He completed graduate CS studies at Johns Hopkins and Georgia "
                    "Tech."
                ),
                "terms": ["graduate CS", "Johns Hopkins", "Georgia Tech"],
            },
        ],
    },
    {
        "id": "recommendations",
        "title": "Recommendations",
        "keywords": [
            "recommendation",
            "recommendations",
            "personable",
            "collaborative",
            "pressure",
            "problem solver",
        ],
        "facts": [
            {
                "id": "recommendations_summary",
                "text": (
                    "Recommendations describe Justin as personable, collaborative, "
                    "calm under pressure, technically deep, and a strong problem "
                    "solver."
                ),
                "terms": [
                    "personable",
                    "collaborative",
                    "calm under pressure",
                    "strong problem solver",
                ],
            },
        ],
    },
    {
        "id": "skills",
        "title": "Skills",
        "keywords": [
            "skills",
            "leadership",
            "public speaking",
            "systems design",
            "ai",
            "ml",
            "kubernetes",
            "rag",
            "observability",
            "mlflow",
        ],
        "facts": [
            {
                "id": "skills_strengths",
                "text": (
                    "Strengths include leadership, public speaking, technical "
                    "writing, pair programming, systems design, AI/ML, Kubernetes, "
                    "secure deployment, RAG, observability, MLFlow, inference "
                    "engines, and mission-critical delivery."
                ),
                "terms": ["leadership", "systems design", "AI/ML", "Kubernetes"],
            },
        ],
    },
    {
        "id": "interests",
        "title": "Interests",
        "keywords": ["interests", "hobbies", "outside work", "personal interests"],
        "facts": [
            {
                "id": "interests_personal",
                "text": "Justin enjoys videogames, hiking, running, and cooking.",
                "terms": ["videogames", "hiking", "running", "cooking"],
            },
        ],
    },
]


def fact_index() -> dict[tuple[str, str], ProfileFact]:
    """Return a lookup table keyed by section id and fact id."""

    index: dict[tuple[str, str], ProfileFact] = {}
    for section in PROFILE_SECTIONS:
        section_id = str(section["id"])
        for fact in section["facts"]:
            if isinstance(fact, dict):
                index[(section_id, str(fact["id"]))] = fact
    return index
