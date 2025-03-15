import { pipeline } from "@huggingface/transformers";

// Type definitions
interface DocumentEmbedding {
  original_text: string;
  summary: string;
  embedding: number[]; // Stored as an array in JSON
}

let cachedEmbeddings: DocumentEmbedding[]; // Cache embeddings in memory

// Function to fetch precomputed embeddings (cached for efficiency)
export async function fetchEmbeddings(): Promise<DocumentEmbedding[]> {
  if (cachedEmbeddings) return cachedEmbeddings; // Return cached version if available

  const res = await fetch("/summarized_embeddings.json");
  if (!res.ok) throw new Error("❌ Failed to load embeddings.json");

  cachedEmbeddings = await res.json(); // Cache embeddings in memory
  return cachedEmbeddings;
}

// Function to calculate cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dotProduct / (normA * normB);
}

// Function to retrieve relevant chunks from precomputed embeddings
export async function getRelevantChunks(
  userQuery: string
): Promise<{ summary: string; score: number }[]> {
  const embeddings = await fetchEmbeddings(); // Load precomputed embeddings
  const embedder = await pipeline(
    "feature-extraction",
    "Xenova/all-MiniLM-L6-v2"
  );

  // Generate embedding for user query (returns an array inside an array)
  const queryEmbeddingNested: number[][] = (await embedder(userQuery, {
    pooling: "mean",
    normalize: true,
  })) as unknown as number[][]; // workaround to get around unsafe casting

  const queryEmbedding = queryEmbeddingNested[0]; // Extract the first (and only) vector

  // Compute similarity scores
  const similarities = embeddings.map((doc) => ({
    summary: doc.summary, // Return summary instead of full text for efficiency
    score: cosineSimilarity(queryEmbedding, doc.embedding),
  }));

  // Return top 3 most relevant text chunks
  return similarities
    .sort((a, b) => b.score - a.score) // Sort by highest similarity
    .slice(0, 3); // Return top 3 matches
}
