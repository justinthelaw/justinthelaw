import {
  env,
  FeatureExtractionPipeline,
  Tensor,
} from "@huggingface/transformers";

env.allowLocalModels = false;

interface DocumentEmbedding {
  text: string;
  embedding: number[];
}

export async function fetchEmbeddings(): Promise<DocumentEmbedding[]> {
  const res = await fetch("/embeddings.json");
  if (!res.ok) throw new Error("Failed to load embeddings.json");
  return res.json();
}

function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, ai, i) => sum + ai * b[i], 0);
}

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = dotProduct(a, b);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (normA * normB);
}

function normalizeVector(vec: number[]): number[] {
  const magnitude = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  return vec.map((v) => v / magnitude);
}

export async function getRelevantChunks(
  userQuery: string,
  embedder: FeatureExtractionPipeline
): Promise<string[]> {
  const embeddings = await fetchEmbeddings();

  const queryEmbeddingTensor: Tensor = await embedder(userQuery, {
    pooling: "mean",
    normalize: true,
  });

  const queryEmbedding = queryEmbeddingTensor.tolist();
  const normalizedQueryEmbedding = normalizeVector(queryEmbedding);

  const similarities = embeddings.map((doc) => ({
    text: doc.text,
    score: cosineSimilarity(normalizedQueryEmbedding, doc.embedding),
  }));

  return similarities
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((item, index) => {
      console.info(`Relevant chunk #${index + 1}:\n`, item.text);
      return item.text;
    });
}
