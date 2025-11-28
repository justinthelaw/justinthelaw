#!/usr/bin/env python3
"""Generate SFT and DPO datasets from PDF resume using llama-server."""

import json
import random
import re
import sys
from pathlib import Path
from typing import TypedDict

import fitz  # type: ignore[import-untyped]
import requests
import yaml
from datasets import Dataset, DatasetDict  # type: ignore[import-untyped]
from tqdm import tqdm

PIPELINE_DIR = Path(__file__).parent.parent
CONFIG = yaml.safe_load((PIPELINE_DIR / "config.yaml").read_text())

# Output paths
DATA_DIR = PIPELINE_DIR / CONFIG["dataset_output"]
SAMPLES_FILE = DATA_DIR / "dpo_samples.jsonl"
SFT_FILE = DATA_DIR / "sft_samples.jsonl"
RAW_TEXT_FILE = PIPELINE_DIR / "resume" / "resume_raw.txt"

PERSON_NAME = CONFIG["person_name"]
PERSON_FULL_NAME = CONFIG.get("person_full_name", PERSON_NAME)

# Must match frontend's buildSmarterSystemMessage() in src/services/ai/contextProvider.ts
TRAINING_SYSTEM = f"You are {PERSON_FULL_NAME}'s AI assistant. Answer questions about {PERSON_NAME} accurately and concisely."


class Sample(TypedDict):
    """DPO sample structure."""

    prompt: str
    chosen: str
    rejected: str


class SFTSample(TypedDict):
    """SFT sample structure with conversation format."""

    messages: list[dict[str, str]]


# LLM prompts for synthetic data generation
QUESTION_PROMPT = """<|begin_of_text|><|start_header_id|>system<|end_header_id|>
Generate a SHORT, SIMPLE question about {name} (5-12 words max). The question MUST include "{name}" or "{name}'s". Make it casual like someone asking a friend. Examples of good questions:
- "What is {name} like?"
- "Where did {name} go to school?"
- "What does {name} do for work?"
- "How do people describe {name}?"
- "What are {name}'s main skills?"
Output ONLY the question, nothing else.<|eot_id|>
<|start_header_id|>user<|end_header_id|>
Resume context: {context}

Generate a short question about {name}'s {category}.<|eot_id|>
<|start_header_id|>assistant<|end_header_id|>
"""

VARIATION_PROMPT = """<|begin_of_text|><|start_header_id|>system<|end_header_id|>
Rephrase this question about {name} in a SHORTER, SIMPLER way (5-12 words max). Keep "{name}" or "{name}'s" in it. Make it sound casual and conversational. Output ONLY the rephrased question.<|eot_id|>
<|start_header_id|>user<|end_header_id|>
Original question: {question}<|eot_id|>
<|start_header_id|>assistant<|end_header_id|>
"""

ANSWER_PROMPT = """<|begin_of_text|><|start_header_id|>system<|end_header_id|>
Answer using ONLY the resume context. Use third-person (e.g., "{name} works at..."). STRICT LIMIT: 1-2 sentences, under 50 words total. Be direct and factual. No filler words or elaboration.<|eot_id|>
<|start_header_id|>user<|end_header_id|>
Resume: {context}

Question: {question}<|eot_id|>
<|start_header_id|>assistant<|end_header_id|>
"""

# No context - hallucination for DPO rejected samples
REJECT_PROMPT = """<|begin_of_text|><|start_header_id|>system<|end_header_id|>
Answer this question about {name}. Make a plausible but INCORRECT guess. STRICT LIMIT: 1-2 sentences, under 50 words. Be direct.<|eot_id|>
<|start_header_id|>user<|end_header_id|>
{question}<|eot_id|>
<|start_header_id|>assistant<|end_header_id|>
"""

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
    "certifications": [
        "professional certifications",
        "credentials",
        "licenses",
        "training certificates",
    ],
}


def get_question_categories() -> dict[str, list[str]]:
    """Get question categories, including military if configured."""
    categories = QUESTION_CATEGORIES.copy()
    if CONFIG["dataset"].get("include_military", False):
        categories["military service"] = [
            "military background",
            "service branch",
            "military rank",
            "military experience",
            "veteran status",
        ]
    return categories


def extract_pdf(path: Path) -> str:
    """Extract text from PDF."""
    doc = fitz.open(path)
    all_text: list[str] = []

    for page in doc:
        text: str = page.get_text("text")
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


def llm_call(prompt: str, temperature: float = 0.7, max_tokens: int = 128) -> str:
    """Call llama-server."""
    server = CONFIG["server"]
    try:
        resp = requests.post(
            f"{server['host']}:{server['port']}/completion",
            json={
                "prompt": prompt,
                "temperature": temperature,
                "n_predict": max_tokens,
                "stop": ["<|eot_id|>", "<|end_of_text|>", "\n\n\n", "Question:"],
                "stream": False,
            },
            timeout=server["timeout"],
        )
        resp.raise_for_status()
        content = resp.json().get("content", "").strip()
        content = re.sub(r"<\|.*?\|>", "", content).strip()
        return content
    except Exception as e:
        print(f"LLM error: {e}")
        return ""


def clean_response(text: str, max_sentences: int = 2, max_words: int = 50) -> str:
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
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    samples.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return samples


def generate_question_variations(
    question: str, num_variations: int, temperature: float
) -> list[str]:
    """Generate variations of a question for data augmentation."""
    variations = [question]

    for _ in range(num_variations - 1):
        prompt = VARIATION_PROMPT.format(name=PERSON_NAME, question=question)
        variation = llm_call(prompt, temperature=temperature, max_tokens=64)
        variation = variation.strip().strip('"').rstrip("?") + "?"

        # Validate
        word_count = len(variation.split())
        if (
            variation
            and len(variation) > 15
            and word_count <= 15  # Keep variations short
            and PERSON_NAME.lower() in variation.lower()
            and variation.lower() != question.lower()
            and variation not in variations
        ):
            variations.append(variation)

    return variations


def generate_dataset(context: str, total_samples: int) -> tuple[list[Sample], list[SFTSample]]:
    """Generate DPO and SFT samples."""
    cfg = CONFIG["dataset"]
    temps = cfg["temperatures"]

    # Load existing
    existing_dpo = load_existing_samples(SAMPLES_FILE)
    existing_sft = load_existing_samples(SFT_FILE)
    existing_questions: set[str] = set()

    for s in existing_dpo:
        if "prompt" in s:
            existing_questions.add(s["prompt"].lower())

    if existing_dpo:
        print(f"Resuming: {len(existing_dpo)} existing DPO samples")
    if existing_sft:
        print(f"Resuming: {len(existing_sft)} existing SFT samples")

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    categories = get_question_categories()
    samples_per_category = total_samples // len(categories)
    variations_per_q = cfg.get("variations_per_question", 3)

    dpo_samples: list[Sample] = []
    sft_samples: list[SFTSample] = []
    generated = 0

    with open(SAMPLES_FILE, "a", encoding="utf-8") as dpo_f, open(
        SFT_FILE, "a", encoding="utf-8"
    ) as sft_f:
        for category, subcategories in categories.items():
            print(f"\nCategory: {category}")

            for _ in tqdm(
                range(samples_per_category // variations_per_q), desc="Generating"
            ):
                # Pick a random subcategory focus
                focus = random.choice(subcategories)

                # Generate base question
                q_prompt = QUESTION_PROMPT.format(
                    context=context, category=f"{category} ({focus})", name=PERSON_NAME
                )
                question = llm_call(
                    q_prompt, temperature=temps["question"], max_tokens=64
                )
                question = question.strip().strip('"').rstrip("?") + "?"

                # Validate question
                if (
                    not question
                    or len(question) < 15
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
                if word_count > 15 and random.random() > 0.1:
                    continue

                # Generate answer with context
                a_prompt = ANSWER_PROMPT.format(
                    context=context, question=question, name=PERSON_NAME
                )
                chosen = llm_call(a_prompt, temperature=temps["answer"], max_tokens=80)
                chosen = clean_response(chosen, max_sentences=2, max_words=50)

                if not chosen or len(chosen) < 15:
                    continue

                # Generate rejected (no context - hallucination)
                r_prompt = REJECT_PROMPT.format(question=question, name=PERSON_NAME)
                rejected = llm_call(
                    r_prompt, temperature=temps["rejected"], max_tokens=80
                )
                rejected = clean_response(rejected, max_sentences=2, max_words=50)

                if not rejected or len(rejected) < 15:
                    continue

                # Skip if too similar
                if chosen.lower()[:50] == rejected.lower()[:50]:
                    continue

                # Generate question variations
                variations = generate_question_variations(
                    question, variations_per_q, temps.get("variation", 0.85)
                )

                for q_var in variations:
                    if q_var.lower() in existing_questions:
                        continue

                    dpo_sample: Sample = {
                        "prompt": q_var,
                        "chosen": chosen,
                        "rejected": rejected,
                    }

                    sft_sample: SFTSample = {
                        "messages": [
                            {"role": "system", "content": TRAINING_SYSTEM},
                            {"role": "user", "content": q_var},
                            {"role": "assistant", "content": chosen},
                        ]
                    }

                    dpo_f.write(json.dumps(dpo_sample) + "\n")
                    sft_f.write(json.dumps(sft_sample) + "\n")
                    dpo_f.flush()
                    sft_f.flush()

                    dpo_samples.append(dpo_sample)
                    sft_samples.append(sft_sample)
                    existing_questions.add(q_var.lower())
                    generated += 1

    print(f"\nGenerated {generated} new samples")
    return (
        load_existing_samples(SAMPLES_FILE),  # type: ignore
        load_existing_samples(SFT_FILE),  # type: ignore
    )


def save_dataset(
    dpo_samples: list[Sample], sft_samples: list[SFTSample]
) -> None:
    """Convert to HuggingFace Dataset format for both SFT and DPO."""
    cfg = CONFIG["dataset"]

    if not dpo_samples or not sft_samples:
        print("Error: No samples to save")
        return

    random.seed(cfg["seed"])

    # Shuffle both in sync
    combined = list(zip(dpo_samples, sft_samples))
    random.shuffle(combined)
    dpo_samples, sft_samples = zip(*combined)  # type: ignore
    dpo_samples = list(dpo_samples)
    sft_samples = list(sft_samples)

    split = int(len(dpo_samples) * cfg["train_split"])

    # Save DPO dataset
    dpo_train, dpo_val = dpo_samples[:split], dpo_samples[split:]
    dpo_dataset = DatasetDict(
        {
            "train": Dataset.from_list(dpo_train),
            "validation": Dataset.from_list(dpo_val),
        }
    )
    dpo_path = DATA_DIR / "dpo"
    dpo_dataset.save_to_disk(str(dpo_path))
    print(f"Saved DPO: {len(dpo_train)} train, {len(dpo_val)} validation -> {dpo_path}")

    # Save SFT dataset
    sft_train, sft_val = sft_samples[:split], sft_samples[split:]
    sft_dataset = DatasetDict(
        {
            "train": Dataset.from_list(sft_train),
            "validation": Dataset.from_list(sft_val),
        }
    )
    sft_path = DATA_DIR / "sft"
    sft_dataset.save_to_disk(str(sft_path))
    print(f"Saved SFT: {len(sft_train)} train, {len(sft_val)} validation -> {sft_path}")

    # Also save combined dataset for backwards compatibility
    combined_dataset = DatasetDict(
        {
            "train": Dataset.from_list(dpo_train),
            "validation": Dataset.from_list(dpo_val),
        }
    )
    combined_dataset.save_to_disk(str(DATA_DIR))
    print(f"Saved combined dataset -> {DATA_DIR}")


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
    if token_estimate > 2000:
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
            f"{server['host']}:{server['port']}/health", timeout=5
        ).raise_for_status()
    except Exception:
        print("Error: llama-server not running. Start with: make serve")
        return 1

    # Generate
    categories = get_question_categories()
    total = CONFIG["dataset"]["samples_per_category"] * len(categories)
    print(f"\nGenerating ~{total} samples ({len(categories)} categories)...")
    print(f"Output: {DATA_DIR}")
    print("(Safe to cancel - progress saved)\n")

    dpo_samples, sft_samples = generate_dataset(context, total)

    if not dpo_samples:
        print("Error: No samples generated")
        return 1

    print(f"\nTotal: {len(dpo_samples)} DPO samples, {len(sft_samples)} SFT samples")
    save_dataset(dpo_samples, sft_samples)
    print("Done!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
