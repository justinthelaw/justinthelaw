import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Cpu, Layers, X } from "@deemlol/next-icons";
import { MODEL_CONTEXT_LIMIT } from "@/config/models";
import {
  cleanInput,
  generatePrompt,
  getPromptBudget,
} from "@/services/ai/contextProvider";
import { ProfileVisualizerScene } from "./ProfileVisualizerScene";
import {
  VISUALIZER_QUESTION,
  VISUALIZER_STAGES,
  type VisualizerStageId,
} from "./visualizerData";
import {
  useTeapotVisualizerTrace,
  type TraceStageState,
} from "./useTeapotVisualizerTrace";

interface ProfileVisualizerModalProps {
  onClose: () => void;
}

interface MessageTransform {
  stageId: VisualizerStageId;
  label: string;
  value: string;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");
const SUGGESTED_PROFILE_QUESTIONS = [
  VISUALIZER_QUESTION,
  "What is Justin building at OpenAI?",
  "What did Justin work on at Defense Unicorns?",
  "What is Justin's military background?",
  "Where did Justin study computer science?",
  "What AI projects has Justin led?",
  "What are Justin's strongest technical skills?",
  "What do recommendations say about Justin?",
  "What are Justin's hobbies outside work?",
] as const;
const SUGGESTED_QUESTION_COUNT = 4;

function getRandomSuggestedQuestions(): readonly string[] {
  const shuffledQuestions = [...SUGGESTED_PROFILE_QUESTIONS];

  for (let index = shuffledQuestions.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffledQuestions[index], shuffledQuestions[swapIndex]] = [
      shuffledQuestions[swapIndex],
      shuffledQuestions[index],
    ];
  }

  return shuffledQuestions.slice(0, SUGGESTED_QUESTION_COUNT);
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => !element.hasAttribute("disabled"))
    .filter((element) => element.offsetParent !== null || element === document.activeElement);
}

function getStageDotClasses(state: TraceStageState): string {
  if (state === "active") {
    return "bg-blue-300 shadow-[0_0_16px_rgba(147,197,253,0.85)]";
  }
  if (state === "complete") {
    return "bg-gray-300";
  }
  if (state === "error") {
    return "bg-red-300";
  }
  return "bg-gray-700";
}

function normalizeTraceText(value: string): string {
  return value.replace(/\s+/g, " ").trimStart();
}

function stateLabel(state: TraceStageState): string {
  if (state === "active") return "active";
  if (state === "complete") return "complete";
  if (state === "error") return "error";
  return "idle";
}

export default function ProfileVisualizerModal({
  onClose,
}: ProfileVisualizerModalProps): React.ReactElement {
  const titleId = useId();
  const descriptionId = useId();
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [question, setQuestion] = useState(VISUALIZER_QUESTION);
  const [suggestedQuestions] = useState<readonly string[]>(
    getRandomSuggestedQuestions
  );
  const resolvedQuestion = useMemo(
    () => question.trim() || VISUALIZER_QUESTION,
    [question]
  );
  const promptBudget = useMemo(
    () => getPromptBudget(resolvedQuestion),
    [resolvedQuestion]
  );
  const cleanedQuestion = useMemo(
    () => cleanInput(resolvedQuestion, promptBudget.inputCharacterLimit),
    [promptBudget.inputCharacterLimit, resolvedQuestion]
  );
  const {
    activeStageId,
    completedStageIds,
    isRunning,
    streamedAnswer,
    loadingMessage,
    progress,
    runTrace,
    getStageState,
  } = useTeapotVisualizerTrace();
  const [selectedStageId, setSelectedStageId] =
    useState<VisualizerStageId>("question");
  const traceListRef = useRef<HTMLOListElement>(null);
  const streamOutputRef = useRef<HTMLOutputElement>(null);
  const [traceEndSpacerHeight, setTraceEndSpacerHeight] = useState(96);
  const orderedBlockRefs = useRef<
    Partial<Record<VisualizerStageId, HTMLLIElement | null>>
  >({});
  const setOrderedBlockRef = useCallback(
    (stageId: VisualizerStageId) =>
      (element: HTMLLIElement | null): void => {
        orderedBlockRefs.current[stageId] = element;
      },
    []
  );
  const updateTraceEndSpacer = useCallback((): void => {
    const traceList = traceListRef.current;
    const finalStageId = VISUALIZER_STAGES[VISUALIZER_STAGES.length - 1]?.id;
    const finalCard = finalStageId ? orderedBlockRefs.current[finalStageId] : null;

    if (!traceList || !finalCard) {
      return;
    }

    const spacerHeight = Math.max(
      28,
      Math.min(168, traceList.clientHeight / 2 - finalCard.offsetHeight / 2)
    );
    setTraceEndSpacerHeight(Math.round(spacerHeight));
  }, []);
  const centerTraceCard = useCallback((stageId: VisualizerStageId): void => {
    window.requestAnimationFrame(() => {
      const traceList = traceListRef.current;
      const traceCard = orderedBlockRefs.current[stageId];

      if (!traceList || !traceCard) {
        traceCard?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
        return;
      }

      const traceListRect = traceList.getBoundingClientRect();
      const traceCardRect = traceCard.getBoundingClientRect();
      const targetScrollTop =
        traceList.scrollTop +
        traceCardRect.top -
        traceListRect.top -
        traceList.clientHeight / 2 +
        traceCardRect.height / 2;

      traceList.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: "smooth",
      });
    });
  }, []);
  const handleStageSelect = useCallback((stageId: VisualizerStageId): void => {
    setSelectedStageId(stageId);
    centerTraceCard(stageId);
  }, [centerTraceCard]);
  useEffect(() => {
    centerTraceCard(activeStageId);
  }, [activeStageId, centerTraceCard]);
  const transformSteps = useMemo<readonly MessageTransform[]>(() => {
    const selectedSections =
      promptBudget.selectedProfileSectionIds.join(", ") || "no profile sections";
    const packedPrompt = cleanedQuestion
      ? generatePrompt(cleanedQuestion)
      : "";

    return [
      {
        stageId: "question",
        label: "Question",
        value: resolvedQuestion,
      },
      {
        stageId: "cleaning",
        label: "Clean input",
        value: cleanedQuestion,
      },
      {
        stageId: "retrieval",
        label: "Select context",
        value: `Sections: ${selectedSections}\nEmbedding lineage: teapotai/teapotembedding`,
      },
      {
        stageId: "budgeting",
        label: "Pack prompt",
        value: `Estimated budget: ${promptBudget.estimatedPromptTokens}/${MODEL_CONTEXT_LIMIT} tokens\nSelected sections: ${selectedSections}`,
      },
      {
        stageId: "worker",
        label: "Send prompt to model",
        value: packedPrompt,
      },
      {
        stageId: "runtime",
        label: "Load runtime",
        value:
          "Transformers.js loads the exported ONNX model in browser WASM, preferring int8 with a uint8 retry.",
      },
      {
        stageId: "encoder",
        label: "Encode prompt",
        value:
          "Tokenizer output and retrieved context become the T5 encoder state.",
      },
      {
        stageId: "lora",
        label: "Apply tuned attention",
        value:
          "Merged q/v LoRA behavior nudges the model toward public-profile grounding and unsupported-fact refusals.",
      },
      {
        stageId: "decoder",
        label: "Decode and render",
        value:
          normalizeTraceText(streamedAnswer) ||
          loadingMessage ||
          "The decoder emits answer tokens and renders the stream here.",
      },
    ];
  }, [
    cleanedQuestion,
    loadingMessage,
    promptBudget,
    resolvedQuestion,
    streamedAnswer,
  ]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(updateTraceEndSpacer);
    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [transformSteps, updateTraceEndSpacer]);

  useEffect(() => {
    function handleResize(): void {
      updateTraceEndSpacer();
    }

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [updateTraceEndSpacer]);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      const streamOutput = streamOutputRef.current;
      if (streamOutput) {
        streamOutput.scrollTop = streamOutput.scrollHeight;
      }

      if (streamedAnswer && activeStageId === "decoder") {
        centerTraceCard("decoder");
      }
    });
  }, [activeStageId, centerTraceCard, streamedAnswer]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !modalRef.current) {
        return;
      }

      const focusableElements = getFocusableElements(modalRef.current);
      if (focusableElements.length === 0) {
        event.preventDefault();
        modalRef.current.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (!modalRef.current.contains(document.activeElement)) {
        event.preventDefault();
        if (event.shiftKey) {
          lastElement.focus();
        } else {
          firstElement.focus();
        }
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [handleKeyDown]);

  function handleBackdropMouseDown(event: React.MouseEvent<HTMLDivElement>): void {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  function handleRunTrace(): void {
    setQuestion(resolvedQuestion);
    runTrace(resolvedQuestion);
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 p-2 sm:p-4"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="mx-auto flex h-[calc(100dvh-1rem)] max-h-[calc(100dvh-1rem)] w-full max-w-7xl flex-col overflow-hidden rounded-lg border border-gray-700 bg-black text-white shadow-2xl sm:h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-2rem)]"
        data-testid="profile-visualizer-modal"
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-800 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-normal text-gray-500">
              <Cpu className="h-4 w-4" aria-hidden="true" />
              Browser architecture trace
            </div>
            <h2
              id={titleId}
              className="mt-1 text-xl font-semibold text-white sm:text-2xl"
            >
              LLM Visualizer
            </h2>
            <p
              id={descriptionId}
              className="mt-1 max-w-3xl text-sm leading-6 text-gray-400"
            >
              An illustrated trace of the profile-QA worker path with live
              worker output: question cleanup, local context selection, ONNX
              runtime loading, T5 encoder-decoder generation, and streamed
              answer rendering.
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gray-900 text-gray-300 transition-colors hover:bg-gray-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-300"
            aria-label="Close LLM Visualizer"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 content-start gap-3 overflow-y-auto p-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.9fr)] lg:content-stretch lg:overflow-hidden lg:p-4">
          <section
            className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-gray-800 bg-black"
            data-testid="profile-visualizer-scene-panel"
          >
            <div className="border-b border-gray-800 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs uppercase tracking-normal text-gray-500">
                  <span className="h-2 w-2 rounded-full bg-blue-300 shadow-[0_0_14px_rgba(147,197,253,0.8)]" />
                  Question packet
                </div>
                <div className="mt-1 flex flex-col items-stretch gap-2 sm:flex-row sm:items-end">
                  <div className="min-w-0 flex-1">
                    <label
                      className="block text-sm font-semibold text-white"
                      htmlFor="profile-visualizer-question"
                    >
                      Ask a profile question to trace
                    </label>
                    <input
                      id="profile-visualizer-question"
                      className="mt-2 block h-11 w-full min-w-0 rounded-lg border border-gray-500 bg-gray-800 px-4 py-2 text-base text-gray-100 outline-none transition-colors placeholder:text-gray-500 focus:border-gray-200 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                      value={question}
                      onChange={(event) => setQuestion(event.target.value)}
                      placeholder={VISUALIZER_QUESTION}
                      disabled={isRunning}
                      data-testid="profile-visualizer-question"
                    />
                  </div>
                  <div className="relative flex h-11 w-full shrink-0 items-end justify-center sm:w-20">
                    <button
                      type="button"
                      className="h-11 w-full rounded-lg bg-blue-600 px-0 font-medium text-white transition-colors duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600"
                      onClick={handleRunTrace}
                      disabled={isRunning}
                      data-testid="profile-visualizer-play"
                    >
                      Send
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span>Try:</span>
                  {suggestedQuestions.map((example) => (
                    <button
                      key={example}
                      type="button"
                      className="rounded-md border border-gray-800 px-2 py-1 text-gray-300 transition-colors hover:border-gray-600 hover:bg-gray-900 disabled:cursor-not-allowed disabled:text-gray-600"
                      onClick={() => setQuestion(example)}
                      disabled={isRunning}
                      data-testid="profile-visualizer-suggestion"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="h-[260px] min-h-[260px] shrink-0 lg:h-auto lg:min-h-0 lg:flex-1">
              <ProfileVisualizerScene
                activeStageId={activeStageId}
                completedStageIds={completedStageIds}
                onStageSelect={handleStageSelect}
              />
            </div>
          </section>

          <aside
            className="flex min-h-[320px] flex-col overflow-hidden rounded-lg border border-gray-800 bg-black lg:min-h-0"
            data-testid="profile-visualizer-trace-panel"
          >
            <section className="flex min-h-0 flex-1 flex-col p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-200">
                  <Layers className="h-4 w-4" aria-hidden="true" />
                  Trace
                </div>
                <span className="text-xs text-gray-500">
                  {progress !== null ? `${progress}%` : loadingMessage}
                </span>
                <span
                  className="sr-only"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {isRunning
                    ? `Visualizer status: ${
                        progress !== null
                          ? `loading ${progress}%`
                          : loadingMessage ?? "running"
                      }`
                    : "Visualizer idle"}
                </span>
              </div>

              <ol
                ref={traceListRef}
                className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1"
                style={{ paddingBottom: traceEndSpacerHeight }}
                data-testid="profile-visualizer-trace-list"
              >
                {transformSteps.map((step, index) => {
                  const stage = VISUALIZER_STAGES[index];
                  const state = getStageState(step.stageId);
                  const isCurrent = activeStageId === step.stageId;
                  const isSelected = selectedStageId === step.stageId;
                  const stageNumber = String(index + 1).padStart(2, "0");
                    const body =
                      step.stageId === "decoder"
                        ? normalizeTraceText(streamedAnswer) ||
                          loadingMessage ||
                          step.value
                        : step.value;

                  return (
                    <li
                      key={step.stageId}
                      id={`profile-visualizer-block-${step.stageId}`}
                      ref={setOrderedBlockRef(step.stageId)}
                      data-testid={`profile-visualizer-transform-${step.stageId}`}
                    >
                      <button
                        type="button"
                        className={`w-full rounded-md border px-3 py-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 ${
                          isCurrent
                            ? "border-blue-300 bg-gray-950 text-white"
                            : isSelected
                              ? "border-gray-500 bg-black text-gray-200"
                              : state === "complete"
                                ? "border-gray-800 bg-black text-gray-300"
                                : state === "error"
                                  ? "border-red-400 bg-red-950/40 text-red-100"
                                  : "border-gray-900 bg-black text-gray-500"
                        }`}
                        onClick={() => handleStageSelect(step.stageId)}
                        aria-current={isCurrent ? "step" : undefined}
                        data-testid={`profile-visualizer-stage-${step.stageId}`}
                        data-stage-state={stateLabel(state)}
                      >
                        <span className="flex items-start gap-3">
                          <span
                            className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${getStageDotClasses(
                              state
                            )}`}
                            aria-hidden="true"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-3">
                              <span className="min-w-0">
                                <span className="mr-2 text-[10px] text-gray-500">
                                  {stageNumber}
                                </span>
                                <span className="text-sm font-semibold text-gray-100">
                                  {step.label}
                                </span>
                              </span>
                              <span className="shrink-0 text-xs text-gray-600">
                                {isCurrent ? "now" : stateLabel(state)}
                              </span>
                            </span>
                            <span className="mt-1 block text-xs text-gray-500">
                              {stage?.label}
                            </span>
                            {step.stageId === "decoder" ? (
                              <output
                                ref={streamOutputRef}
                                className="mt-2 block max-h-56 overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-gray-900 bg-black/40 p-2 font-mono text-[11px] leading-5 text-gray-300"
                                data-testid="profile-visualizer-stream"
                              >
                                {body}
                              </output>
                            ) : (
                              <span className="mt-2 block max-h-56 overflow-y-auto whitespace-pre-wrap break-words rounded-md border border-gray-900 bg-black/40 p-2 font-mono text-[11px] leading-5 text-gray-300">
                                {body}
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
