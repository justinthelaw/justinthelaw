import {
  FeatureExtractionPipeline,
  pipeline,
  TextGenerationPipeline,
} from "@huggingface/transformers";

let model: TextGenerationPipeline | FeatureExtractionPipeline;

type TaskType = "text-generation" | "feature-extraction";

async function loadModel(
  task: TaskType,
  modelId: string,
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
    | undefined
): Promise<TextGenerationPipeline | FeatureExtractionPipeline> {
  try {
    model = await pipeline(task, modelId, {
      dtype: dtype,
      progress_callback: (x) => {
        self.postMessage({ status: "load", response: x });
      },
    });
  } catch (e) {
    const error = `Error loading ${task} pipeline: ${e}`;
    self.postMessage({ status: "stream", response: error });
    console.error(error);
  }
  return model;
}

export default loadModel;
