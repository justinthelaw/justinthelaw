import os
import json
import fitz  # type: ignore # PyMuPDF
import numpy as np
import requests
import re
import unicodedata
import nltk  # type: ignore
from nltk.tokenize import sent_tokenize  # type: ignore
from sentence_transformers import SentenceTransformer
from typing import List, Dict
from transformers import pipeline # type: ignore

# Ensure NLTK resources are available
nltk.download("punkt_tab")

# Define models
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
SUMMARIZATION_MODEL = "google-t5/t5-base"

# PDF source
PDF_URLS = [
    "https://drive.google.com/uc?export=download&id=1o3hw7mOlJ5JB9XfoDQNdv8aBdCVPl8cp"
]

# Output storage
OUTPUT_DIR = "public"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "summarized_embeddings.json")


def download_pdf(url: str, filename: str) -> str:
    """Download PDF from URL and save it locally."""
    print(f"📥 Downloading: {url}")
    response = requests.get(url)
    if response.status_code == 200:
        file_path = os.path.join(OUTPUT_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(response.content)
        return file_path
    else:
        raise Exception(f"❌ Failed to download {url}")


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text while preserving structure (headings, bullet points)."""
    print(f"📜 Extracting text from: {pdf_path}")
    doc = fitz.open(pdf_path)
    extracted_text = []

    for page in doc:
        extracted_text.append(page.get_text("text"))

    return clean_text("\n".join(extracted_text))


def clean_text(text: str) -> str:
    """Normalize text and remove extra spaces."""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def chunk_text(text: str, chunk_size: int = 300, overlap: int = 50) -> List[str]:
    """Break text into semantic chunks based on sentence boundaries."""
    print("🔍 Performing text chunking...")
    sentences = sent_tokenize(text)  # Split text into sentences

    chunks = []
    current_chunk: list[str] = []
    current_length = 0

    for sentence in sentences:
        sentence_length = len(sentence.split())
        if current_length + sentence_length > chunk_size:
            chunks.append(" ".join(current_chunk))
            current_chunk = current_chunk[-overlap:]  # Retain overlap
            current_length = sum(len(sent.split()) for sent in current_chunk)

        current_chunk.append(sentence)
        current_length += sentence_length

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    print(f"📝 Created {len(chunks)} semantic chunks.")
    return chunks


def summarize_chunks(chunks: List[str]) -> List[str]:
    """Summarize each chunk before embedding."""
    print("📝 Summarizing chunks before embedding...")
    summarizer = pipeline("summarization", model=SUMMARIZATION_MODEL, truncation=True)

    summaries = []
    for chunk in chunks:
        summary = summarizer(chunk, max_length=100, min_length=1, do_sample=False)[0][
            "summary_text"
        ]
        summaries.append(summary)

    print(f"✅ Generated {len(summaries)} summaries.")
    return summaries


def generate_embeddings(texts: List[str]) -> np.ndarray:
    """Generate sentence embeddings for chunks."""
    print("🧠 Generating embeddings...")
    model = SentenceTransformer(EMBEDDING_MODEL, trust_remote_code=True)
    return model.encode(texts, normalize_embeddings=True)


def create_embedding_documents(
    original_chunks: List[str], summaries: List[str], embeddings: np.ndarray
) -> List[Dict[str, object]]:
    """Structure summaries and embeddings for JSON output."""
    embedded_docs = []
    for i in range(len(original_chunks)):  # Ensure alignment of indexes
        embedded_docs.append(
            {
                "original_text": original_chunks[i],
                "summary": summaries[i],
                "embedding": embeddings[i].tolist(),
            }
        )
    return embedded_docs


def generate_pdf_embeddings():
    """Main function to process PDFs and generate summarized embeddings."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    all_chunks = []
    for i, url in enumerate(PDF_URLS):
        pdf_path = download_pdf(url, f"document_{i}.pdf")
        extracted_text = extract_text_from_pdf(pdf_path)

        if extracted_text.strip():
            chunks = chunk_text(extracted_text)  # Use fixed chunking method
        else:
            print(f"⚠️ Warning: No text extracted from {pdf_path}")
            chunks = []

        all_chunks.extend(chunks)

    # Summarize before embedding
    summaries = summarize_chunks(all_chunks)

    # Generate embeddings on summaries
    embeddings = generate_embeddings(summaries)

    # Save summaries + embeddings
    embedded_docs = create_embedding_documents(all_chunks, summaries, embeddings)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(embedded_docs, f, indent=2)

    print(f"✅ Summarized embeddings saved to {OUTPUT_FILE}")


if __name__ == "__main__":
    try:
        generate_pdf_embeddings()
    except Exception as e:
        print(f"❌ Failed to generate embeddings: {e}")
