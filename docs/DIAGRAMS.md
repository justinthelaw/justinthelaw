# Diagrams

This is the compact system map for humans and coding agents. It explains how
the static app, browser chatbot, and optional profile-QA fine-tuning pipeline
fit together.

## Source Of Truth

| Need | Primary file | Notes |
| --- | --- | --- |
| Site identity, repository, resume, links | `src/config/site.ts` | Drives the page and GitHub Pages URL derivation |
| Browser chatbot facts | `src/config/site.ts` | `PROFILE_SECTIONS` is the runtime context source |
| Training chatbot facts | `ml/profile-qa/profile_qa/public_profile.py` | Keep in sync with public facts when retraining |
| Prompt wording and generation knobs | `src/config/prompts.ts` | Includes welcome messages and generation parameters |
| Browser model and context limit | `src/config/models.ts` | Default is `int8` with `uint8` fallback |
| Prompt retrieval and budget trimming | `src/services/ai/contextProvider.ts` | Ranks profile sections and fits prompt/history into budget |
| Worker inference | `src/services/ai/worker.ts` | Runs Transformers.js off the main thread |
| LLM Visualizer | `src/components/profile/ProfileVisualizerModal.tsx` | Lazy client-only Three.js modal for the browser AI architecture trace |
| Local training defaults | `ml/profile-qa/profile_qa/config.py` | Holds model IDs, 1024-token budget, and LoRA defaults |
| Pipeline commands | `ml/profile-qa/README.md` | Command-level training, eval, export, and publish guide |

## Application Runtime

```mermaid
flowchart TD
  visitor["Visitor browser"] --> staticSite["Static export in out/"]
  staticSite --> page["src/pages/index.tsx"]
  page --> profile["GitHubProfile"]
  profile --> github["GitHub REST API"]
  page --> resume["ResumeViewer"]
  resume --> drive["Google Drive PDF preview"]
  page --> chat["ChatContainer, client only"]
  page --> visualizer["LLM Visualizer modal, client only"]
  chat --> chatHooks["Chat hooks"]
  chatHooks --> chatStore["Zustand chat store"]
  chatHooks --> aiService["AIService"]
  visualizer --> three["Three.js architecture scene"]
  visualizer --> trace["Local trace controller"]
  trace --> aiService
  aiService --> worker["Web Worker"]
  worker --> loader["modelLoader.ts"]
  loader --> hf["Hugging Face model files"]
  worker --> context["contextProvider.ts"]
  context --> profileSections["PROFILE_SECTIONS"]
  worker --> stream["Typed WorkerStatus stream"]
  stream --> chatStore
  chatStore --> chat
```

## Chat Generation Flow

```mermaid
sequenceDiagram
  participant User
  participant UI as "Chat UI"
  participant Store as "Zustand store"
  participant Service as "AIService"
  participant Worker as "AI worker"
  participant Context as "contextProvider"
  participant Model as "Transformers.js"

  User->>UI: Ask a question
  UI->>Store: Add user message
  UI->>Service: Generate with recent turns
  Service->>Worker: WorkerAction.GENERATE
  Worker->>Context: Clean input and build prompt
  Context-->>Worker: Selected sections, history, and budgeted prompt
  Worker->>Model: Generate with configured params
  Model-->>Worker: Streamed text
  Worker-->>Service: WorkerStatus.STREAM
  Service-->>Store: Update current response
  Store-->>UI: Render streaming answer
  Worker-->>Service: WorkerStatus.DONE
```

## Static Export And Base Path

```mermaid
flowchart LR
  repoConfig["SITE_CONFIG.repository"] --> derived["DERIVED_CONFIG"]
  derived --> nextConfig["next.config.ts"]
  nextConfig --> build["npm run build"]
  build --> outDir["out/ static files"]
  outDir --> actions["GitHub Pages Actions deploy"]
  outDir --> manual["npm run deploy to gh-pages"]
  outDir --> preview["npm start static preview"]
  actions --> pages["GitHub Pages"]
  manual --> pages
  derived --> basePath["Production basePath: /repository-name"]
  derived --> assetPrefix["Production assetPrefix"]
```

Rules:

| Rule | Detail |
| --- | --- |
| Production base path | Derived from `SITE_CONFIG.repository.name` |
| Asset paths | Do not hardcode `/justinthelaw` or any asset path in components |
| Static preview | `npm start` serves `out/`; run `npm run build` first, and the preview server infers the base path and redirects `/` to it |
| Deploy paths | CI deploys with GitHub Pages Actions; `npm run deploy` is the manual `gh-pages -d out` path |
| Static-only app | No API routes, server actions, or server-side data loading |

## Fine-Tuning Pipeline

```mermaid
flowchart TD
  facts["Public profile facts"] --> pyProfile["public_profile.py"]
  pyProfile --> data["synthetic_data.py"]
  data --> train["train_lora.py"]
  train --> eval["evaluate.py"]
  eval --> gate["Promotion gate"]
  gate --> merge["merge_adapter.py"]
  merge --> export["export_onnx.py"]
  export --> artifacts["prepare_hf_artifacts.py"]
  artifacts --> publish["publish.py"]
  publish --> hfRepo["Hugging Face model repo"]
  hfRepo --> modelConfig["src/config/models.ts"]
  modelConfig --> browser["Browser worker loads promoted model"]
```

Use this pipeline only when prompt/context edits are not enough. The browser app
does not train models and does not call a server.

## Fine-Tuning Configuration

| Step | Configure | Guardrail |
| --- | --- | --- |
| Facts | `src/config/site.ts` and `ml/profile-qa/profile_qa/public_profile.py` | Keep public facts aligned before generating data |
| Dataset | `python -m profile_qa.synthetic_data` | Generated data stays under ignored `ml/profile-qa/data/` |
| Training | `ml/profile-qa/profile_qa/config.py` or CLI flags | Fixed `teapotai/teapotllm` base; local 8GB NVIDIA LoRA/QLoRA runs |
| Evaluation | `python -m profile_qa.evaluate` | Seq2seq only; adapters must record `teapotai/teapotllm` as their base |
| ONNX export | `python -m profile_qa.export_onnx` | Requires the merged Teapot lineage marker; rejects `.onnx.data`; publishes `int8` and `uint8` encoder/decoder artifacts |
| App promotion | `src/config/models.ts` | Update `MODEL_ID` and keep `MODEL_CONTEXT_LIMIT` honest |

Promotion should satisfy the gate in `ml/profile-qa/README.md` before changing
the app default model.

## Agent Notes

| Note | Detail |
| --- | --- |
| Paths | Prefer exact file paths in documentation updates |
| Scope | Keep this file diagram-first and concise; put command details in `ml/profile-qa/README.md` |
| Flow changes | Update the matching diagram in the same change |
| Profile facts | Keep the TypeScript and Python profile sources synchronized when facts change for a retrained model |
