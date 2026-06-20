import { MODEL_CONTEXT_LIMIT, MODEL_ID } from "@/config/models";

export const VISUALIZER_QUESTION = "What is Justin's current job at OpenAI?";
export const TEAPOT_BASE_MODEL_ID = "teapotai/teapotllm";
export const TEAPOT_EMBEDDING_MODEL_ID = "teapotai/teapotembedding";

export type VisualizerStageId =
  | "question"
  | "cleaning"
  | "retrieval"
  | "budgeting"
  | "worker"
  | "runtime"
  | "encoder"
  | "lora"
  | "decoder";

export interface VisualizerStage {
  id: VisualizerStageId;
  label: string;
  shortLabel: string;
  detail: string;
}

export const VISUALIZER_STAGES: readonly VisualizerStage[] = [
  {
    id: "question",
    label: "User question",
    shortLabel: "Question",
    detail: "The trace starts with the exact prompt sent by the play button.",
  },
  {
    id: "cleaning",
    label: "Input cleaning",
    shortLabel: "Clean",
    detail: "The worker normalizes punctuation, removes risky brackets, and trims whitespace.",
  },
  {
    id: "retrieval",
    label: "Profile retrieval",
    shortLabel: "RAG",
    detail:
      "The browser path ranks local profile sections; Teapot's model card reports upstream RAG tuning across multiple documents with its embedding model.",
  },
  {
    id: "budgeting",
    label: "Prompt budgeting",
    shortLabel: "Budget",
    detail: `The prompt is packed for the ${MODEL_CONTEXT_LIMIT}-token browser budget.`,
  },
  {
    id: "worker",
    label: "Browser worker",
    shortLabel: "Worker",
    detail: "Generation runs off the main thread through the shared AI worker service.",
  },
  {
    id: "runtime",
    label: "ONNX browser runtime",
    shortLabel: "ONNX",
    detail:
      "Transformers.js loads the promoted ONNX artifact in WASM before generation starts.",
  },
  {
    id: "encoder",
    label: "T5 encoder",
    shortLabel: "Encoder",
    detail:
      "TeapotLLM uses a T5 encoder-decoder config, so the packed context is encoded before answer decoding.",
  },
  {
    id: "lora",
    label: "LoRA-trained attention",
    shortLabel: "q/v trained",
    detail:
      "The profile continuation trained q and v attention adapters, then merged that behavior into the exported model.",
  },
  {
    id: "decoder",
    label: "Decode and render",
    shortLabel: "Answer",
    detail:
      "The decoder produces grounded answer tokens and renders the stream in one final trace step.",
  },
];

export interface ModelFact {
  label: string;
  value: string;
}

export const MODEL_FACTS: readonly ModelFact[] = [
  {
    label: "Browser model",
    value: MODEL_ID,
  },
  {
    label: "Upstream base",
    value: TEAPOT_BASE_MODEL_ID,
  },
  {
    label: "Architecture",
    value: "T5 encoder-decoder via seq2seq generation",
  },
  {
    label: "Upstream RAG",
    value: `model-card reported ${TEAPOT_EMBEDDING_MODEL_ID} multi-document RAG tuning`,
  },
  {
    label: "Browser dtype",
    value: "int8 preferred, uint8 fallback",
  },
  {
    label: "LoRA targets",
    value: "q and v attention projections",
  },
  {
    label: "LoRA settings",
    value: "rank 16, alpha 32, dropout 0.03",
  },
];
