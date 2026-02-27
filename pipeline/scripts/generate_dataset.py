#!/usr/bin/env python3
"""Generate SFT and DPO datasets from PDF resume using llama-server."""

import json
import random
import re
import sys
from pathlib import Path
from typing import TypedDict

import fitz
import requests
from datasets import Dataset, DatasetDict
from tqdm import tqdm
from utils import (
    ANSWER_MAX_TOKENS,
    CONFIG,
    CONTEXT_TOKEN_WARN,
    HEALTH_CHECK_TIMEOUT,
    LLM_DEFAULT_MAX_TOKENS,
    LLM_DEFAULT_TEMPERATURE,
    LLM_VARIATION_MAX_TOKENS,
    LONG_QUESTION_SKIP_PROB,
    MAX_ANSWER_SENTENCES,
    MAX_ANSWER_WORDS,
    MAX_QUESTION_WORDS,
    MIN_ANSWER_LENGTH,
    MIN_QUESTION_LENGTH,
    MIN_VARIATION_LENGTH,
    PIPELINE_DIR,
    QUESTION_MAX_TOKENS,
    STOP_SEQUENCES,
    SYSTEM_PROMPT,
)

# Output paths
DATA_DIR = PIPELINE_DIR / CONFIG["dataset_output"]
SAMPLES_FILE = DATA_DIR / "sft_samples.jsonl"
METADATA_FILE = DATA_DIR / "metadata.json"
RAW_TEXT_FILE = PIPELINE_DIR / "resume" / "resume_raw.txt"

PERSON_NAME = CONFIG["person_name"]
PERSON_FULL_NAME = CONFIG["person_full_name"]


class SFTSample(TypedDict):
    """SFT sample structure with conversation format."""

    messages: list[dict[str, str]]


# LLM prompts for synthetic data generation (model-agnostic)
QUESTION_SYSTEM = """Generate a SHORT, SIMPLE question about {name} (5-12 words max). The question MUST include "{name}" or "{name}'s". Make it casual like someone asking a friend. Examples of good questions:
- "What is {name} like?"
- "Where did {name} go to school?"
- "What does {name} do for work?"
- "How do people describe {name}?"
- "What are {name}'s main skills?"
Output ONLY the question, nothing else."""

QUESTION_USER = """Resume context: {context}

Generate a short question about {name}'s {category}."""

VARIATION_SYSTEM = """Rephrase this question about {name} in a SHORTER, SIMPLER way (5-12 words max). Keep "{name}" or "{name}'s" in it. Make it sound casual and conversational. Output ONLY the rephrased question."""

VARIATION_USER = """Original question: {question}"""

ANSWER_SYSTEM = """Answer using ONLY the resume context. Use third-person (e.g., "{name} works at..."). STRICT LIMIT: 1-2 sentences, under 50 words total. Be direct and factual. No filler words or elaboration."""

ANSWER_USER = """Resume: {context}

Question: {question}"""

QUESTION_CATEGORIES = {
    "work experience": [
        "current role",
        "previous jobs",
        "work responsibilities",
        "career history",
        "job titles",
        "companies worked at",
    ],
    "technical skills": [
        "programming languages",
        "technologies",
        "frameworks",
        "tools",
        "technical expertise",
        "software skills",
    ],
    "education": [
        "degrees",
        "schools",
        "academic background",
        "studies",
        "university",
        "certifications",
    ],
    "projects": [
        "notable projects",
        "accomplishments",
        "work they've built",
        "contributions",
        "portfolio",
    ],
    "leadership": [
        "management experience",
        "team leadership",
        "mentoring",
        "leading projects",
        "supervisory roles",
    ],
    "achievements": [
        "awards",
        "recognition",
        "accomplishments",
        "notable achievements",
        "milestones",
    ],
    "character": [
        "interests",
        "personality traits",
        "hobbies",
        "recommendations",
    ],
}


def get_question_categories() -> dict[str, list[str]]:
    """Get question categories with optional config-driven category toggles."""
    categories = {
        category: list(subcategories)
        for category, subcategories in QUESTION_CATEGORIES.items()
    }

    if not CONFIG["dataset"].get("has_recommendations", True):
        categories["character"] = [
            subcategory
            for subcategory in categories["character"]
            if subcategory != "recommendations"
        ]

    if CONFIG["dataset"].get("include_military", False):
        categories["military service"] = [
            "military background",
            "service branch",
            "military rank",
            "military experience",
        ]
    return categories


def extract_pdf(path: Path) -> str:
    """Extract text from PDF."""
    doc = fitz.open(path)  # type: ignore
    all_text: list[str] = []

    for page in doc:
        text: str = page.get_text("text")  # type: ignore[assignment]
        if text.strip():
            all_text.append(text)

    doc.close()
    raw_text = "\n".join(all_text)
    return clean_text(raw_text)


def clean_text(text: str) -> str:
    """Clean and deduplicate extracted PDF text."""
    # Remove PII
    text = re.sub(r"https?://[^\s]+", "", text)
    text = re.sub(r"www\.[^\s]+", "", text)
    text = re.sub(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", "", text)
    text = re.sub(r"\+?1?\s*\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}", "", text)

    # Remove social media
    text = re.sub(r"LinkedIn Profile", "", text, flags=re.IGNORECASE)
    text = re.sub(r"linkedin\.com[^\s]*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"github\.com[^\s]*", "", text, flags=re.IGNORECASE)

    # Normalize
    text = re.sub(r"[•●○◦▪▸►‣⁃∙]", "-", text)
    text = re.sub(r"[│|┃┆┇┊┋→←↑↓↔↕]", " ", text)
    text = re.sub(r"[\u2000-\u200F\u2028-\u202F]", " ", text)

    # Clean whitespace
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n\s*\n+", "\n\n", text)
    text = re.sub(r"^\s+", "", text, flags=re.MULTILINE)
    text = re.sub(r"Page \d+ of \d+", "", text, flags=re.IGNORECASE)

    # Deduplicate lines
    lines = text.split("\n")
    seen: set[str] = set()
    deduped: list[str] = []
    for line in lines:
        line_clean = line.strip()
        if line_clean and line_clean not in seen:
            seen.add(line_clean)
            deduped.append(line)
        elif not line_clean:
            deduped.append(line)

    text = "\n".join(deduped)
    text = re.sub(r"\(\s*\)", "", text)
    text = re.sub(r"\[\s*\]", "", text)

    return text.strip()


def llm_call(
    messages: list[dict[str, str]],
    temperature: float = LLM_DEFAULT_TEMPERATURE,
    max_tokens: int = LLM_DEFAULT_MAX_TOKENS,
) -> str:
    """Call llama-server using OpenAI-compatible chat completions endpoint."""
    server = CONFIG["server"]
    try:
        resp = requests.post(
            f"{server['host']}:{server['port']}/v1/chat/completions",
            json={
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stop": STOP_SEQUENCES,
                "stream": False,
            },
            timeout=server["timeout"],
        )
        resp.raise_for_status()
        response_json = resp.json()
        content = response_json["choices"][0]["message"]["content"].strip()
        return content
    except requests.exceptions.Timeout:
        print(f"LLM error: Request timeout after {server['timeout']}s")
        return ""
    except requests.exceptions.RequestException as e:
        print(f"LLM error: {e}")
        return ""
    except (KeyError, IndexError) as e:
        print(f"LLM error: Unexpected response format - {e}")
        return ""


def clean_response(
    text: str, max_sentences: int = MAX_ANSWER_SENTENCES, max_words: int = MAX_ANSWER_WORDS
) -> str:
    """Clean and truncate response."""
    text = re.sub(r"\(?\d+-\d+ sentences?\)?\.?", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\(?Note:.*?\)?", "", text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r"end of (?:quote|response|answer).*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"^(?:Answer|Response):\s*", "", text, flags=re.IGNORECASE)
    text = text.strip()

    # Truncate to max sentences
    sentences = re.split(r"(?<=[.!?])\s+", text)
    if len(sentences) > max_sentences:
        text = " ".join(sentences[:max_sentences])

    # Truncate to max words
    words = text.split()
    if len(words) > max_words:
        text = " ".join(words[:max_words])
        # Ensure ends with period
        if not text.endswith("."):
            text = text.rstrip(".,;:") + "."

    return text.strip()


def load_existing_samples(file_path: Path) -> list[dict]:
    """Load existing samples from JSONL."""
    if not file_path.exists():
        return []

    samples: list[dict] = []
    with file_path.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    samples.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return samples


class ProgressMetadata(TypedDict):
    """Progress tracking metadata."""

    samples_per_category_target: int
    variations_per_question: int
    category_progress: dict[str, dict[str, int]]  # {category: {completed_iterations, samples_generated}}


def load_metadata() -> ProgressMetadata | None:
    """Load progress metadata from disk."""
    if not METADATA_FILE.exists():
        return None

    try:
        with METADATA_FILE.open(encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, KeyError):
        return None


def save_metadata(metadata: ProgressMetadata) -> None:
    """Save progress metadata to disk."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with METADATA_FILE.open("w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)


def init_metadata(
    samples_per_category: int, variations_per_q: int, categories: dict[str, list[str]]
) -> ProgressMetadata:
    """Initialize metadata structure."""
    return ProgressMetadata(
        samples_per_category_target=samples_per_category,
        variations_per_question=variations_per_q,
        category_progress={
            cat: {"completed_iterations": 0, "samples_generated": 0} for cat in categories
        },
    )


def generate_question_variations(
    question: str, num_variations: int, temperature: float
) -> list[str]:
    """Generate variations of a question for data augmentation."""
    variations = [question]

    for _ in range(num_variations - 1):
        messages = [
            {"role": "system", "content": VARIATION_SYSTEM.format(name=PERSON_NAME)},
            {"role": "user", "content": VARIATION_USER.format(question=question)},
        ]
        variation = llm_call(messages, temperature=temperature, max_tokens=LLM_VARIATION_MAX_TOKENS)
        variation = variation.strip().strip('"').rstrip("?") + "?"

        # Validate
        word_count = len(variation.split())
        if (
            variation
            and len(variation) > MIN_VARIATION_LENGTH
            and word_count <= MAX_QUESTION_WORDS
            and PERSON_NAME.lower() in variation.lower()
            and variation.lower() != question.lower()
            and variation not in variations
        ):
            variations.append(variation)

    return variations


def generate_dataset(context: str, total_samples: int) -> list[SFTSample]:
    """Generate SFT samples."""
    cfg = CONFIG["dataset"]
    temps = cfg["temperatures"]

    # Load existing
    existing_sft = load_existing_samples(SAMPLES_FILE)
    existing_questions: set[str] = set()

    for s in existing_sft:
        if "messages" in s and len(s["messages"]) >= 2:
            # Extract question from user message
            user_msg = next((m for m in s["messages"] if m["role"] == "user"), None)
            if user_msg:
                existing_questions.add(user_msg["content"].lower())

    if existing_sft:
        print(f"Loaded: {len(existing_sft)} existing SFT samples")

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    categories = get_question_categories()
    samples_per_category = total_samples // len(categories)
    variations_per_q = cfg.get("variations_per_question", 3)
    target_iterations = samples_per_category // variations_per_q

    # Load or initialize metadata
    metadata = load_metadata()
    if metadata is None:
        metadata = init_metadata(samples_per_category, variations_per_q, categories)
        print("Starting fresh generation")
    else:
        # Check if config changed (backfill needed)
        config_changed = (
            metadata["samples_per_category_target"] != samples_per_category
            or metadata["variations_per_question"] != variations_per_q
        )
        if config_changed:
            print(
                f"Config changed: {metadata['samples_per_category_target']} → {samples_per_category} samples/category"
            )
            metadata["samples_per_category_target"] = samples_per_category
            metadata["variations_per_question"] = variations_per_q
        # Add any new categories
        for cat in categories:
            if cat not in metadata["category_progress"]:
                metadata["category_progress"][cat] = {"completed_iterations": 0, "samples_generated": 0}
                print(f"New category detected: {cat}")

    sft_samples: list[SFTSample] = []
    generated = 0

    with SAMPLES_FILE.open("a", encoding="utf-8") as sft_f:
        for category, subcategories in categories.items():
            cat_progress = metadata["category_progress"][category]
            completed = cat_progress["completed_iterations"]
            remaining = max(0, target_iterations - completed)

            if remaining == 0:
                print(f"\nCategory: {category} (✓ complete: {cat_progress['samples_generated']} samples)")
                continue

            print(
                f"\nCategory: {category} (resuming: {completed}/{target_iterations} iterations, "
                f"{cat_progress['samples_generated']} samples)"
            )

            for _ in tqdm(range(remaining), desc="Generating"):
                # Pick a random subcategory focus
                focus = random.choice(subcategories)  # noqa: S311

                # Generate base question
                messages = [
                    {"role": "system", "content": QUESTION_SYSTEM.format(name=PERSON_NAME)},
                    {
                        "role": "user",
                        "content": QUESTION_USER.format(
                            context=context, category=f"{category} ({focus})", name=PERSON_NAME
                        ),
                    },
                ]
                question = llm_call(
                    messages, temperature=temps["question"], max_tokens=QUESTION_MAX_TOKENS
                )
                question = question.strip().strip('"').rstrip("?") + "?"

                # Validate question
                if (
                    not question
                    or len(question) < MIN_QUESTION_LENGTH
                    or question.lower() in existing_questions
                ):
                    continue
                if any(
                    x in question.lower()
                    for x in ["resume", "context", "provided", "document"]
                ):
                    continue
                if PERSON_NAME.lower() not in question.lower():
                    continue
                # Prefer short questions
                word_count = len(question.split())
                if word_count > MAX_QUESTION_WORDS and random.random() > LONG_QUESTION_SKIP_PROB:  # noqa: S311
                    continue

                # Generate answer with context
                messages = [
                    {"role": "system", "content": ANSWER_SYSTEM.format(name=PERSON_NAME)},
                    {
                        "role": "user",
                        "content": ANSWER_USER.format(context=context, question=question),
                    },
                ]
                answer = llm_call(
                    messages, temperature=temps["answer"], max_tokens=ANSWER_MAX_TOKENS
                )
                answer = clean_response(answer, max_sentences=MAX_ANSWER_SENTENCES, max_words=MAX_ANSWER_WORDS)

                if not answer or len(answer) < MIN_ANSWER_LENGTH:
                    continue

                # Generate question variations
                variations = generate_question_variations(
                    question, variations_per_q, temps.get("variation", 0.85)
                )

                for q_var in variations:
                    if q_var.lower() in existing_questions:
                        continue

                    sft_sample: SFTSample = {
                        "messages": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": q_var},
                            {"role": "assistant", "content": answer},
                        ]
                    }

                    sft_f.write(json.dumps(sft_sample) + "\n")
                    sft_f.flush()

                    sft_samples.append(sft_sample)
                    existing_questions.add(q_var.lower())
                    generated += 1
                    cat_progress["samples_generated"] += 1

                # Update progress after each iteration
                cat_progress["completed_iterations"] += 1
                save_metadata(metadata)

    print(f"\nGenerated {generated} new samples")
    loaded_samples = load_existing_samples(SAMPLES_FILE)
    # Type cast to SFTSample list (samples are already in correct format)
    return [SFTSample(messages=s["messages"]) for s in loaded_samples]


def save_dataset(sft_samples: list[SFTSample]) -> None:
    """Convert to HuggingFace Dataset format for SFT."""
    cfg = CONFIG["dataset"]

    if not sft_samples:
        print("Error: No samples to save")
        return

    random.seed(cfg["seed"])
    random.shuffle(sft_samples)  # noqa: S311

    split = int(len(sft_samples) * cfg["train_split"])

    # Save SFT dataset
    sft_train, sft_val = sft_samples[:split], sft_samples[split:]
    # Convert TypedDict to dict for Dataset.from_list
    train_dicts = [dict(s) for s in sft_train]
    val_dicts = [dict(s) for s in sft_val]
    sft_dataset = DatasetDict(
        {
            "train": Dataset.from_list(train_dicts),
            "validation": Dataset.from_list(val_dicts),
        }
    )
    sft_path = DATA_DIR / "sft"
    sft_dataset.save_to_disk(str(sft_path))
    print(f"Saved SFT: {len(sft_train)} train, {len(sft_val)} validation -> {sft_path}")


def main() -> int:
    resume_path = PIPELINE_DIR / CONFIG["resume_path"]

    if not resume_path.exists():
        print(f"Error: Resume not found at {resume_path}")
        return 1

    # Extract text
    print(f"Extracting from {resume_path}")
    context = extract_pdf(resume_path)
    token_estimate = len(context) // 4
    print(f"Extracted {len(context)} chars (~{token_estimate} tokens)")

    # Warn if context is large
    if token_estimate > CONTEXT_TOKEN_WARN:
        print(
            f"⚠️  Warning: Large context ({token_estimate} tokens). "
            "Consider shortening resume for better results."
        )

    # Save raw text
    RAW_TEXT_FILE.parent.mkdir(parents=True, exist_ok=True)
    RAW_TEXT_FILE.write_text(context, encoding="utf-8")
    print(f"Saved: {RAW_TEXT_FILE}")

    # Preview mode
    if len(sys.argv) > 1 and sys.argv[1] == "--preview":
        print("\n=== Resume Preview ===\n")
        print(context)
        return 0

    # Check server
    server = CONFIG["server"]
    try:
        requests.get(
            f"{server['host']}:{server['port']}/health", timeout=HEALTH_CHECK_TIMEOUT
        ).raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"Error: llama-server not running - {e}")
        return 1

    # Generate
    categories = get_question_categories()
    samples_per_cat = CONFIG["dataset"]["samples_per_category"]
    variations = CONFIG["dataset"]["variations_per_question"]
    # Actual iterations: samples_per_category // variations_per_question per category
    # Each iteration attempts to generate 'variations' samples (some may be skipped)
    base_questions = samples_per_cat // variations
    target_samples = base_questions * variations * len(categories)
    print(f"\nGenerating ~{target_samples} samples ({len(categories)} categories)")
    print(f"  • {base_questions} base questions × {variations} variations per category")
    print("  • Actual output may be lower due to validation filters")
    print(f"Output: {DATA_DIR}")
    print("(Safe to cancel - progress saved)\n")

    sft_samples = generate_dataset(context, target_samples)

    if not sft_samples:
        print("Error: No samples generated")
        return 1

    print(f"\nTotal: {len(sft_samples)} SFT samples")
    save_dataset(sft_samples)
    print("Done!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
