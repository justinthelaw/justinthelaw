# Architecture and flows

The portfolio is a static website. Inference runs in the visitor's browser;
training and model publishing are separate local operations under `llm/`.
See [Customization](CUSTOMIZATION.md) for configuration fields.

## Website runtime

```mermaid
flowchart TD
  export["Static export: out/"] --> pages["Pages-router UI"]
  pages --> profile["GitHubProfile"]
  fallback["Configured bio fallback"] --> profile
  profile -->|Hydration refresh| github["GitHub REST API"]
  pages --> resume["Google Drive resume iframe"]
  pages --> chat["Client-only chat"]
  pages --> arcade["Arcade cards"]
  chat --> hooks["Chat hooks and Zustand"]
  hooks -->|Download consent| service["AIService"]
  service --> worker["AI Web Worker"]
  worker -->|Model files| hub["Hugging Face"]
  facts["public-profile.json"] --> context["Context selection and budget"]
  context --> worker
  worker -->|Typed responses| hooks
  arcade -->|Play| player["Same-origin game iframe"]
```

The profile renders its configured fallback until a successful hydration fetch.
Chat history lives in the in-memory Zustand store. Downloaded model files run
through Transformers.js in `src/services/ai/worker.ts`; there is no inference
server or browser-side training.

## Chat generation

```mermaid
sequenceDiagram
  participant UI as Chat hooks and store
  participant Service as AIService
  participant Worker as AI worker
  participant Context as Context provider
  participant Model as Transformers.js
  UI->>UI: Store question and select recent turns
  UI->>Service: generate(input, turns)
  Service->>Worker: WorkerAction.GENERATE
  Worker->>Context: Clean input and budget facts/history
  Context-->>Worker: Formatted prompt
  Worker->>Model: Generate with configured parameters
  Model-->>Worker: Stream text
  Worker-->>Service: WorkerStatus.STREAM
  Service-->>UI: Notify subscribers
  Worker-->>Service: WorkerStatus.DONE
  Service-->>UI: Finalize answer in history
```

Canonical facts and identity come from `src/config/public-profile.json`.
`models.ts` controls context/dtype settings; `prompts.ts` controls messages and
generation parameters. Automatic model loading tries `int8`, then `uint8`.

## Arcade boundary

| Owner | Responsibility |
| --- | --- |
| `src/config/arcade.ts` and `ArcadeGames.tsx` | Cards and selected game state |
| `GamePlayer.tsx` | Full-viewport dialog, iframe lifecycle, return focus |
| `GameControls.tsx` | Touch overlay and control rendering |
| `useGameControls.ts` | Input ownership, interruption cleanup, and overlay visibility |
| `gameFrame.ts` | Same-origin recipients, exact-document focus, and keyboard event delivery |
| `gameKeys.ts` | Shared keyboard definitions |
| `touchCapability.ts` | Session touch capability and subscriptions |
| Focused iframe | Native desktop keyboard input |
| `games/<game>/` | Game simulation and its declared static distribution |

Cards remain mounted behind the player. The bridge preserves typing protection,
key ownership, cancellation, and focus across loads. Website tests use inert
HTML/key recorders; they do not execute game source or prove gameplay fidelity.
See [website instructions](../src/AGENTS.md#input-bridge) for the input contract.

The host publishes overlay visibility on the iframe root as
`data-arcade-controls-visible="true"` or `"false"` and dispatches
`arcade-controls-visibility` on the child window with `{ visible: boolean }`
detail. Games can read the attribute at startup and listen for later changes;
the host republishes on iframe loads. The website's shared test fixture
intercepts every `/games/` URL with inert HTML by default; input tests override
it with key recorders.

## Static build and deployment

```mermaid
flowchart TD
  config["SITE_CONFIG.repository"] --> derived["DERIVED_CONFIG"]
  derived --> next["Next.js static export"]
  games["games/ distributions"] --> copy["postbuild: export-games.mjs"]
  next --> copy
  copy --> output["out/"]
  output --> preview["npm start"]
  output --> actions["Pages Actions artifact"]
  output --> manual["Manual gh-pages publish"]
  actions --> pages["GitHub Pages"]
  manual --> pages
```

Production paths derive from the configured repository; user/organization site
repositories use the domain root. `trailingSlash: true` exports routes such as
`out/arcade/index.html`. Preview serves an existing build and infers its prefix.
Publishing requires authorization; building alone does not deploy.

## Local model pipeline

```mermaid
flowchart TD
  facts["public-profile.json"] --> data["Synthetic dataset"]
  data --> train["LoRA or QLoRA training"]
  base["Pinned Teapot base revision"] --> train
  train --> checkpoint["Adapter and lineage"]
  checkpoint --> evaluate["Evaluation and predictions"]
  data --> evaluate
  checkpoint --> merge["Merge adapter"]
  merge --> export["Native T5 ONNX export"]
  export --> quantize["Quantize and embed tensors"]
  evaluate --> gate["Promotion evidence"]
  quantize --> gate
  gate --> package["Prepare artifacts and model card"]
  package --> publish["Authorized Hugging Face publish"]
  publish --> config["Browser model configuration"]
```

The pipeline binds evaluation to dataset, prompts, generation/scoring contracts,
model representation, and digests. Export verifies lineage; quantization binds
to the floating-point input; browser artifacts reject external tensor data.
Use [llm/AGENTS.md](../llm/AGENTS.md) for commands and the complete promotion gate.
