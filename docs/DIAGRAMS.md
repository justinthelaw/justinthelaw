# Diagrams

This is the compact system map for humans and coding agents. It explains how
the static app, browser chatbot, and optional profile-QA fine-tuning pipeline
fit together.

## Source Of Truth

| Need | Primary file | Notes |
| --- | --- | --- |
| Site identity, repository, resume, links | `src/config/site.ts` | Drives the page and GitHub Pages URL derivation |
| Browser and training chatbot facts | `src/config/public-profile.json` | Shared source for retrieval metadata, fact text, and evaluation terms |
| Prompt wording and generation knobs | `src/config/prompts.ts` | Includes welcome messages and generation parameters |
| Browser model and context limit | `src/config/models.ts` | Default is `int8` with `uint8` fallback |
| Prompt retrieval and budget trimming | `src/services/ai/contextProvider.ts` | Ranks profile sections and fits prompt/history into budget |
| Worker inference | `src/services/ai/worker.ts` | Runs Transformers.js off the main thread |
| Local training defaults | `ml/profile-qa/profile_qa/config.py` | Holds model IDs, 1024-token budget, and LoRA defaults |
| Pipeline commands | `ml/profile-qa/README.md` | Command-level training, eval, export, and publish guide |

## Application Runtime

```mermaid
flowchart TD
  siteConfig["SITE_CONFIG.githubBioFallback"] --> staticSite
  visitor["Visitor browser"] --> staticSite["Static export in out/"]
  staticSite --> page["src/pages/index.tsx"]
  page --> profile["GitHubProfile renders configured fallback"]
  profile -->|"After hydration: refresh"| github["GitHub REST API"]
  github -->|"Success: replace bio"| profile
  github -.->|"Failure: keep fallback"| profile
  page --> resume["ResumeViewer"]
  resume --> drive["Google Drive PDF preview"]
  page --> chat["ChatContainer, client only"]
  chat --> chatHooks["Chat hooks"]
  chatHooks --> chatStore["Zustand chat store"]
  chatHooks --> consent["Explicit model-download consent"]
  consent --> aiService["AIService"]
  aiService --> worker["Web Worker"]
  worker --> loader["modelLoader.ts"]
  loader --> hf["Hugging Face model files"]
  worker --> context["contextProvider.ts"]
  canonicalProfile["public-profile.json"] --> profileSections["PROFILE_SECTIONS"]
  canonicalProfile --> profileSubject["PROFILE_SUBJECT"]
  profileSubject --> promptIdentity["Browser prompt identity"]
  promptIdentity --> context
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
  derived --> nextConfig["next.config.mjs"]
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
  facts["src/config/public-profile.json"] --> pyProfile["public_profile.py loader"]
  pyProfile --> data["synthetic_data.py"]
  pyProfile --> eval
  data --> train["train_lora.py"]
  train --> eval["evaluate.py"]
  data --> datasetDigest["Canonical dataset digest"]
  eval --> promptDigest["Formatted prompt digest"]
  eval --> scoringDigest["Scoring and generation contracts"]
  eval --> reports["Reports with predictions and provenance"]
  datasetDigest --> reports
  promptDigest --> reports
  scoringDigest --> reports
  eval --> gate["Promotion gate"]
  gate --> merge["merge_adapter.py"]
  baseRevision["Pinned base revision"] --> train
  baseRevision --> eval
  baseRevision --> merge
  train --> checkpointConfig["Adapter config with pinned revision"]
  checkpointConfig --> eval
  checkpointConfig --> merge
  merge --> lineage["Portable label plus model digests"]
  merge --> export["export_onnx.py"]
  lineage --> export
  export --> native["native_t5_onnx.py: PyTorch ONNX"]
  native --> fpArtifact["Encoder and merged decoder plus digest"]
  fpArtifact --> quantized["Quantized files bound to FP digest"]
  quantized --> browserArtifact["Browser files plus digest"]
  browserArtifact --> artifacts["prepare_hf_artifacts.py"]
  lineage --> artifacts
  reports --> artifacts
  checkpointConfig --> artifacts
  releaseDate["Explicit release date"] --> artifacts
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
| Facts | `src/config/public-profile.json` | Canonical public facts and subject metadata, loaded by both browser and Python consumers |
| Dataset | `python -m profile_qa.synthetic_data` | Generated data stays under ignored `ml/profile-qa/data/` |
| Training | `ml/profile-qa/profile_qa/config.py` or CLI flags | Fixed `teapotai/teapotllm` base; the pinned revision is persisted in and verified from each PEFT checkpoint |
| Evaluation | `python -m profile_qa.evaluate` | Reports bind the canonical published dataset, exact formatted prompts, split, pinned base revision, model digest, generation contract, and scoring implementation; packaging recomputes scores and requires one promoted model representation |
| ONNX export | `python -m profile_qa.export_onnx` | Native PyTorch T5 export preserves dynamic shapes and initial/cached decoding; verifies merged lineage/digests, binds quantization to its full-precision input, rejects `.onnx.data`, and publishes `int8` and `uint8` encoder/decoder artifacts |
| App promotion | `src/config/models.ts` | Update `MODEL_ID` and keep `MODEL_CONTEXT_LIMIT` honest |

Promotion should satisfy the gate in `ml/profile-qa/README.md` before changing
the app default model.

## Agent Notes

| Note | Detail |
| --- | --- |
| Paths | Prefer exact file paths in documentation updates |
| Scope | Keep this file diagram-first and concise; put command details in `ml/profile-qa/README.md` |
| Flow changes | Update the matching diagram in the same change |
| Profile facts | Update only `src/config/public-profile.json`; TypeScript and Python consumers load it directly |
