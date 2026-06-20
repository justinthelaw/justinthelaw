import { useCallback, useEffect, useRef, useState } from "react";
import { WorkerStatus, type WorkerResponse } from "@/types/worker";
import { getAIService } from "@/services/ai";
import {
  VISUALIZER_QUESTION,
  VISUALIZER_STAGES,
  type VisualizerStageId,
} from "./visualizerData";

type TracePhase = "idle" | "preparing" | "loading" | "generating";
export type TraceStageState = "idle" | "active" | "complete" | "error";

export interface TraceEvent {
  id: string;
  label: string;
  detail: string;
}

export interface UseTeapotVisualizerTraceReturn {
  activeStageId: VisualizerStageId;
  completedStageIds: readonly VisualizerStageId[];
  errorStageId: VisualizerStageId | null;
  isRunning: boolean;
  streamedAnswer: string;
  loadingMessage: string | null;
  progress: number | null;
  traceEvents: readonly TraceEvent[];
  runTrace: (question: string) => void;
  getStageState: (stageId: VisualizerStageId) => TraceStageState;
}

const STAGE_ORDER = VISUALIZER_STAGES.map((stage) => stage.id);
const PRE_WORKER_STAGE_DELAYS: readonly [VisualizerStageId, number][] = [
  ["question", 0],
  ["cleaning", 320],
  ["retrieval", 660],
  ["budgeting", 980],
  ["worker", 1_320],
];
const GENERATION_STAGE_DELAYS: readonly [VisualizerStageId, number][] = [
  ["lora", 360],
  ["decoder", 760],
];
const RUNTIME_START_DELAY = 520;
const GENERATE_AFTER_LOAD_DELAY = 420;
const FINISH_AFTER_DONE_DELAY = 1_060;

function getCompletedBefore(stageId: VisualizerStageId): VisualizerStageId[] {
  const stageIndex = STAGE_ORDER.indexOf(stageId);
  return stageIndex <= 0 ? [] : STAGE_ORDER.slice(0, stageIndex);
}

function eventId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useTeapotVisualizerTrace(): UseTeapotVisualizerTraceReturn {
  const [activeStageId, setActiveStageId] =
    useState<VisualizerStageId>("question");
  const [completedStageIds, setCompletedStageIds] = useState<
    readonly VisualizerStageId[]
  >([]);
  const [errorStageId, setErrorStageId] = useState<VisualizerStageId | null>(
    null
  );
  const [isRunning, setIsRunning] = useState(false);
  const [streamedAnswer, setStreamedAnswer] = useState("");
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [traceEvents, setTraceEvents] = useState<readonly TraceEvent[]>([]);
  const activeStageIdRef = useRef<VisualizerStageId>("question");
  const questionRef = useRef(VISUALIZER_QUESTION);
  const phaseRef = useRef<TracePhase>("idle");
  const timersRef = useRef<number[]>([]);
  const loadFailedRef = useRef(false);
  const hasGeneratedRef = useRef(false);

  const clearTimers = useCallback((): void => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current = [];
  }, []);

  const pushEvent = useCallback((label: string, detail: string): void => {
    setTraceEvents((events) => [
      ...events,
      {
        id: eventId(),
        label,
        detail,
      },
    ]);
  }, []);

  const activateStage = useCallback((stageId: VisualizerStageId): void => {
    activeStageIdRef.current = stageId;
    setActiveStageId(stageId);
    setCompletedStageIds(getCompletedBefore(stageId));
  }, []);

  const scheduleStage = useCallback(
    (stageId: VisualizerStageId, delay: number, onActivate?: () => void): void => {
      const timerId = window.setTimeout(() => {
        if (phaseRef.current === "idle") {
          return;
        }
        if (
          STAGE_ORDER.indexOf(stageId) <=
          STAGE_ORDER.indexOf(activeStageIdRef.current)
        ) {
          return;
        }
        activateStage(stageId);
        onActivate?.();
      }, delay);
      timersRef.current.push(timerId);
    },
    [activateStage]
  );

  const finishTrace = useCallback((): void => {
    clearTimers();
    phaseRef.current = "idle";
    setIsRunning(false);
    setErrorStageId(null);
    setActiveStageId("decoder");
    setCompletedStageIds(STAGE_ORDER);
    pushEvent("done", "The worker reported completion for this trace.");
  }, [clearTimers, pushEvent]);

  const handleWorkerResponse = useCallback(
    (response: WorkerResponse): void => {
      if (phaseRef.current === "idle") {
        return;
      }

      switch (response.status) {
        case WorkerStatus.LOAD: {
          const message = response.message ?? "Loading model...";
          activateStage("runtime");
          setLoadingMessage(message);
          setProgress(response.progress ?? null);
          pushEvent("load", message);
          return;
        }

        case WorkerStatus.INITIATE:
          phaseRef.current = "generating";
          activateStage("encoder");
          pushEvent("initiate", "The worker accepted the prompt and began generation.");
          GENERATION_STAGE_DELAYS.forEach(([stageId, delay]) => {
            scheduleStage(stageId, delay);
          });
          return;

        case WorkerStatus.STREAM:
          if (response.response) {
            setStreamedAnswer((answer) => `${answer}${response.response}`);
            pushEvent("stream", response.response);
          }
          return;

        case WorkerStatus.ERROR:
          loadFailedRef.current = true;
          phaseRef.current = "idle";
          setIsRunning(false);
          setErrorStageId(activeStageIdRef.current);
          setLoadingMessage(response.message ?? null);
          pushEvent("error", response.error ?? "Unknown worker error");
          return;

        case WorkerStatus.DONE:
          if (phaseRef.current === "loading") {
            if (loadFailedRef.current) {
              return;
            }
            const timerId = window.setTimeout(() => {
              if (phaseRef.current !== "loading" || loadFailedRef.current) {
                return;
              }

              phaseRef.current = "generating";
              pushEvent("generate", `Sending: ${questionRef.current}`);
              getAIService().generate(questionRef.current);
            }, GENERATE_AFTER_LOAD_DELAY);
            timersRef.current.push(timerId);
            return;
          }

          if (phaseRef.current === "generating") {
            const timerId = window.setTimeout(() => {
              if (phaseRef.current === "generating") {
                finishTrace();
              }
            }, FINISH_AFTER_DONE_DELAY);
            timersRef.current.push(timerId);
          }
          return;

        default:
          return;
      }
    },
    [activateStage, finishTrace, pushEvent, scheduleStage]
  );

  useEffect(() => {
    const aiService = getAIService();
    const unsubscribe = aiService.subscribe(handleWorkerResponse);

    return () => {
      unsubscribe();
      clearTimers();
    };
  }, [clearTimers, handleWorkerResponse]);

  const runTrace = useCallback((question: string): void => {
    if (isRunning) {
      return;
    }

    const nextQuestion = question.trim() || VISUALIZER_QUESTION;
    questionRef.current = nextQuestion;
    clearTimers();
    loadFailedRef.current = false;
    hasGeneratedRef.current = false;
    phaseRef.current = "preparing";
    setIsRunning(true);
    setStreamedAnswer("");
    setLoadingMessage("Preparing worker trace...");
    setProgress(null);
    setTraceEvents([]);
    setErrorStageId(null);
    activateStage("question");
    pushEvent("question", nextQuestion);

    PRE_WORKER_STAGE_DELAYS.forEach(([stageId, delay]) => {
      scheduleStage(stageId, delay, () => {
        if (stageId !== "worker" || hasGeneratedRef.current) {
          return;
        }

        hasGeneratedRef.current = true;
        phaseRef.current = "loading";
        setLoadingMessage("Starting browser worker...");

        const timerId = window.setTimeout(() => {
          if (phaseRef.current !== "loading" || loadFailedRef.current) {
            return;
          }

          activateStage("runtime");
          const aiService = getAIService();
          if (aiService.isModelReady()) {
            setLoadingMessage("Using loaded ONNX runtime...");
            setProgress(100);
            pushEvent("load", "Using the model already loaded by the chat window.");

            const generateTimerId = window.setTimeout(() => {
              if (phaseRef.current !== "loading" || loadFailedRef.current) {
                return;
              }

              phaseRef.current = "generating";
              pushEvent("generate", `Sending: ${questionRef.current}`);
              aiService.generate(questionRef.current);
            }, GENERATE_AFTER_LOAD_DELAY);
            timersRef.current.push(generateTimerId);
            return;
          }

          setLoadingMessage("Loading ONNX runtime...");
          if (!aiService.isInitialized()) {
            aiService.initialize();
          }
          aiService.loadModel();
        }, RUNTIME_START_DELAY);
        timersRef.current.push(timerId);
      });
    });
  }, [activateStage, clearTimers, isRunning, pushEvent, scheduleStage]);

  const getStageState = useCallback(
    (stageId: VisualizerStageId): TraceStageState => {
      if (errorStageId === stageId) {
        return "error";
      }
      if (activeStageId === stageId && isRunning) {
        return "active";
      }
      return completedStageIds.includes(stageId) ? "complete" : "idle";
    },
    [activeStageId, completedStageIds, errorStageId, isRunning]
  );

  return {
    activeStageId,
    completedStageIds,
    errorStageId,
    isRunning,
    streamedAnswer,
    loadingMessage,
    progress,
    traceEvents,
    runTrace,
    getStageState,
  };
}
