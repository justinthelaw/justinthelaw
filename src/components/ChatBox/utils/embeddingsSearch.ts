import {
  DataArray,
  FeatureExtractionPipeline,
  Tensor,
} from "@huggingface/transformers";

import loadModel from "@/components/ChatBox/utils/loadModel";

interface DocumentEmbedding {
  text: string;
  embedding: number[];
}

export async function fetchEmbeddings(): Promise<DocumentEmbedding[]> {
  const res = await fetch("/embeddings.json");
  if (!res.ok) throw new Error("Failed to load embeddings.json");
  return res.json();
}

function cosineSimilarity(a: DataArray, b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function searchResults(
  embeddingModel: string,
  dtype:
    | "auto"
    | "fp32"
    | "fp16"
    | "q8"
    | "int8"
    | "uint8"
    | "q4"
    | "bnb4"
    | "q4f16"
    | Record<
        string,
        | "auto"
        | "fp32"
        | "fp16"
        | "q8"
        | "int8"
        | "uint8"
        | "q4"
        | "bnb4"
        | "q4f16"
      >
    | undefined,
  query: string,
  topK: number = 3
): Promise<string> {
  const textEmbedder = (await loadModel(
    "feature-extraction",
    embeddingModel,
    dtype
  )) as FeatureExtractionPipeline;

  const docs = await fetchEmbeddings();

  const rawEmbedding: Tensor = await textEmbedder(query, {
    normalize: true,
  });
  const queryEmbedding: DataArray = rawEmbedding.data;

  const scored = docs.map((doc) => ({
    text: doc.text,
    score: cosineSimilarity(queryEmbedding, doc.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  const finalList = scored.slice(0, topK);

  return finalList.map((chunk) => chunk.text).join("\n");
}
