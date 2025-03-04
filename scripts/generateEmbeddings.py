import os
import json
import fitz  # type: ignore
import numpy as np
import requests
import re
import unicodedata
from sentence_transformers import SentenceTransformer
from typing import List, Dict

PDF_URLS = [
    "https://drive.google.com/uc?export=download&id=1o3hw7mOlJ5JB9XfoDQNdv8aBdCVPl8cp"
]

OUTPUT_DIR = "public"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "embeddings.json")

EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


def download_pdf(url: str, filename: str) -> str:
    print(f"Downloading: {url}")
    response = requests.get(url)
    if response.status_code == 200:
        file_path = os.path.join(OUTPUT_DIR, filename)
        with open(file_path, "wb") as f:
            f.write(response.content)
        return file_path
    else:
        raise Exception(f"Failed to download {url}")


def extract_text_from_pdf(pdf_path: str) -> str:
    print(f"Extracting text from: {pdf_path}")
    doc = fitz.open(pdf_path)
    extracted_text = "\n".join(page.get_text("text") for page in doc)
    return clean_text(extracted_text)


def clean_text(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def generate_embeddings(texts: List[str]) -> np.ndarray:
    print("Generating embeddings...")
    model = SentenceTransformer(EMBEDDING_MODEL, trust_remote_code=True)
    return model.encode(texts, normalize_embeddings=True)  # Returns np.ndarray


def create_embedding_documents(
    pdf_texts: List[str], embeddings: np.ndarray
) -> List[Dict[str, object]]:
    embedded_docs: List[Dict[str, object]] = []

    for i, text in enumerate(pdf_texts):
        embedded_docs.append({"text": text, "embedding": embeddings[i].tolist()})

    return embedded_docs


def split_text(text: str, chunk_size: int = 50, overlap: int = 0) -> list:
    words = text.split()
    chunks = []
    i = 0

    while i < len(words):
        chunk = words[i : i + chunk_size]
        chunks.append(" ".join(chunk))
        i += chunk_size - overlap

    return chunks


def generate_pdf_embeddings():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    all_chunks = []
    for i, url in enumerate(PDF_URLS):
        pdf_path = download_pdf(url, f"document_{i}.pdf")
        extracted_text = extract_text_from_pdf(pdf_path)
        if extracted_text.strip():
            chunks = split_text(extracted_text)
        else:
            print(f"Warning: No text extracted from {pdf_path}")
            chunks = []

        all_chunks.extend(chunks)  # Ensure chunks are added correctly

    embeddings = generate_embeddings(all_chunks)  # Now generates an embedding per chunk

    embedded_docs = create_embedding_documents(all_chunks, embeddings)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(embedded_docs, f, indent=2)

    print(f"✅ Embeddings saved to {OUTPUT_FILE}")


if __name__ == "__main__":
    try:
        generate_pdf_embeddings()
    except Exception as e:
        print(f"❌ Failed to generate embeddings: {e}")
