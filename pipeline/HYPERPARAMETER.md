# Pipeline Hyperparameter + LoRA Knob Guide

Scope: tuning knobs in [`config.yaml`](./config.yaml), with practical effects and tradeoffs.

## Quick Strategy

- Tune in this order: `dataset` -> `lora` + `sft` -> `quantization` -> `evaluation.thresholds`.
- Change only 1-2 knobs per run, then compare against previous `data/eval_reports/*`.
- Keep `evaluation.seed` fixed while tuning to avoid noisy comparisons.

## Model Choice (Most Important Knob)

### What works best for LoRA SFT here

- Best default profile for this repo (browser ONNX target): small instruction-tuned decoder models in the ~300M to ~1.5B range.
- Current default in `config.yaml`: `Qwen/Qwen2.5-0.5B-Instruct`.
- Why:
  - LoRA converges faster on instruction/chat-formatted bases.
  - ONNX export + Web inference stays practical.
  - Quantized variants remain usable on consumer hardware/mobile.

### Recommended model tiers

| Tier            | Typical size | Quality                               | Latency/size | When to use                                          |
| --------------- | -----------: | ------------------------------------- | ------------ | ---------------------------------------------------- |
| Tiny instruct   |    300M-500M | Good for focused resume Q&A           | Best         | Browser-first deployment, strict memory limits       |
| Small instruct  |      1B-1.5B | Better factual consistency/robustness | Moderate     | If fp32/quantized latency budgets still pass         |
| Larger instruct |          3B+ | Higher ceiling                        | Expensive    | Usually too heavy for this pipeline's browser target |

### Model selection rules

- Prefer instruction/chat variants over base pretrain-only models.
- Prefer architectures already proven in `transformers` + `optimum` ONNX export paths.
- Avoid models with exotic/custom ops unless you have already validated export + runtime behavior.

## Dataset Generation Knobs

| Key                               | Default | Why this value                                           | Increase if                                        | Decrease if                                                 | Performance impact                                                         |
| --------------------------------- | ------: | -------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------- |
| `dataset.samples_per_category`    |  `1200` | Balanced runtime/coverage baseline                       | Underfitting, weak recall                          | Overtraining time/cost too high                             | More data usually improves robustness until label noise dominates          |
| `dataset.variations_per_question` |     `3` | Balances diversity and duplication risk                  | Model overfits exact phrasing                      | Too many near-duplicates                                    | More variants improve lexical robustness but can inflate noisy paraphrases |
| `dataset.temperatures.question`   |   `0.9` | Encourages diverse question phrasing                     | Questions look repetitive                          | Questions become incoherent/off-topic                       | Higher diversity can improve generalization; too high hurts data quality   |
| `dataset.temperatures.answer`     |   `0.1` | Keeps answers factual/anchored to context                | Answers too short/rigid                            | Hallucination or style drift                                | Lower values reduce hallucination in synthetic labels                      |
| `dataset.temperatures.variation`  |   `1.0` | Strong paraphrase diversity                              | Variation quality too similar                      | Variations become noisy                                     | Controls paraphrase spread; too high introduces label mismatch             |
| `dataset.train_split`             |   `0.9` | More train data while keeping validation signal          | Need faster convergence                            | Need stronger model selection signal                        | More train helps fit; less val can hide overfitting                        |
| `dataset.seed`                    |    `88` | Deterministic shuffle/split                              | Rarely change; for robustness sweeps               | Reproducibility required                                    | Seed changes sample order; can shift measured quality slightly             |
| `dataset.include_military`        |  `true` | Adds military-service category when relevant             | Resume includes service details                    | Not applicable to subject                                   | Adds/removes topical coverage                                              |
| `dataset.has_recommendations`     |  `true` | Controls whether "recommendations" prompts are generated | You have recommendation/reference content to model | You want character questions without recommendation framing | Adds/removes recommendation-focused Q/A coverage                           |

Notes:

- Effective generated count is bounded by validation filters and by integer division logic around `samples_per_category // variations_per_question`.
- Higher sample counts increase generation + training time linearly.

## LLM Data-Generation Defaults

| Key                                    |                      Default | Role                                       | Increase if                     | Decrease if                               | Performance impact                                            |
| -------------------------------------- | ---------------------------: | ------------------------------------------ | ------------------------------- | ----------------------------------------- | ------------------------------------------------------------- |
| `llm_defaults.temperature`             |                        `0.7` | Fallback generation creativity             | Outputs too repetitive          | Outputs too random                        | Affects synthetic data diversity/cleanliness                  |
| `llm_defaults.max_tokens`              |                        `128` | Fallback max output tokens                 | Truncation observed             | Verbosity/noise in outputs                | Too small truncates labels; too large can add drift           |
| `llm_defaults.variation_max_tokens`    |                         `64` | Max tokens for paraphrases                 | Variations cut off              | Variations too long/noisy                 | Constrains paraphrase length                                  |
| `llm_defaults.long_question_skip_prob` |                        `0.1` | Chance to keep long questions (> word cap) | Need more long-query robustness | Want stricter short-question distribution | Small amount helps robustness without shifting style too much |
| `llm_defaults.stop_sequences`          | `["\\n\\n\\n", "Question:"]` | Prevents run-on outputs                    | Model leaks template text       | Premature stopping                        | Controls truncation behavior in synthetic generation          |

## Generation + Validation Limits

| Key                                      | Default | Role                               | Increase if                             | Decrease if                      | Performance impact                                                    |
| ---------------------------------------- | ------: | ---------------------------------- | --------------------------------------- | -------------------------------- | --------------------------------------------------------------------- |
| `generation_limits.question_max_tokens`  |    `64` | Max tokens for question generation | Questions get cut                       | Questions become verbose         | Longer questions can improve complexity but hurt style consistency    |
| `generation_limits.answer_max_tokens`    |    `80` | Max tokens for answer generation   | Answers truncate                        | Answers ramble                   | Directly affects label completeness vs concision                      |
| `generation_limits.min_question_length`  |    `15` | Reject too-short questions         | Too many rejected valid short questions | Weak/underspecified prompts pass | Controls minimum prompt quality                                       |
| `generation_limits.min_answer_length`    |    `15` | Reject too-short answers           | Answers overly terse                    | Filler answers pass              | Helps enforce informative labels                                      |
| `generation_limits.min_variation_length` |    `15` | Reject trivial paraphrases         | Useful short paraphrases rejected       | Weak paraphrases accepted        | Governs paraphrase utility                                            |
| `generation_limits.max_question_words`   |    `15` | Cap question verbosity             | Need longer natural queries             | Want tighter prompt style        | Shorter questions can simplify task; may reduce long-query robustness |
| `generation_limits.max_answer_sentences` |     `2` | Hard brevity target                | Need slightly richer answers            | Answers too long for product UX  | Trains concise response behavior                                      |
| `generation_limits.max_answer_words`     |    `50` | Hard word cap                      | Answers missing key facts               | Overly long answers              | Tight cap improves compliance metrics, may reduce coverage            |
| `validation.context_token_warn`          |  `2000` | Warn on oversized resume context   | Context often long but valid            | Want stricter context budget     | Large context can degrade generation fidelity                         |

## LoRA Knobs

| Key                   |            Default | Why this value                       | Increase if                                    | Decrease if                       | Performance impact                                                   |
| --------------------- | -----------------: | ------------------------------------ | ---------------------------------------------- | --------------------------------- | -------------------------------------------------------------------- |
| `lora.r`              |               `64` | Balanced adapter capacity             | Underfitting persists after data/epochs tuning | Overfitting or memory pressure    | Higher `r` raises adaptation capacity, params, and memory            |
| `lora.alpha`          |              `128` | Scaling matches `2 * r` pattern      | Adapter updates too weak                       | Training unstable/over-aggressive | Higher alpha amplifies adapter contribution                          |
| `lora.dropout`        |             `0.05` | Light regularization                 | Overfitting (val loss diverges)                | Underfitting/slow convergence     | More dropout improves generalization but can reduce fit              |
| `lora.target_modules` | q/k/v/o + MLP proj | Full attention + FFN adaptation      | Need stronger style/task transfer              | Need smaller adapter footprint    | Wider targeting improves quality ceiling, increases trainable params |

Practical profiles:

- Conservative: `r=32`, `alpha=64`, `dropout=0.05`.
- Current balanced default: `r=64`, `alpha=128`, `dropout=0.05`.
- High-capacity: `r=128`, `alpha=256`, `dropout=0.05`.
- Aggressive regularized: `r=128`, `alpha=256`, `dropout=0.1`.

## SFT Training Knobs

| Key                         | Default | Why this value                      | Increase if                      | Decrease if                        | Performance impact                                                |
| --------------------------- | ------: | ----------------------------------- | -------------------------------- | ---------------------------------- | ----------------------------------------------------------------- |
| `sft.epochs`                |     `8` | Balanced runtime/quality baseline   | Underfitting                     | Overfitting or diminishing returns | More epochs improve recall until memorization/noise               |
| `sft.batch_size`            |    `16` | Throughput on modern hardware       | Gradients too noisy              | OOM or poor generalization         | Larger batch stabilizes updates, can reduce regularization effect |
| `sft.gradient_accumulation` |     `4` | Effective batch scaling without OOM | Need larger effective batch      | Need faster updates/less latency   | Raises effective batch; slower wall-clock per optimizer step      |
| `sft.learning_rate`         |  `2e-5` | Stable LoRA SFT baseline            | Loss plateaus early              | Loss oscillation/divergence        | Most sensitive knob after data quality                            |
| `sft.max_length`            |   `384` | Matches short Q&A format            | Truncation of meaningful context | Unused padding/compute overhead    | Longer length increases memory/latency                            |
| `sft.warmup_ratio`          |  `0.05` | Prevents early-step instability     | Early loss spikes                | Convergence too slow               | Warmup stabilizes start; too high wastes training budget          |
| `sft.weight_decay`          |   `0.0` | Common for LoRA adapters            | Overfitting in long runs         | Underfitting                       | Small decay can help generalization on noisy datasets             |
| `sft.gradient_checkpointing`| `false` | Faster default for 0.5B model       | Memory pressure/OOM              | Need more throughput               | Checkpointing saves memory but increases wall-clock time          |
| `sft.packing`               |  `true` | Packs short chats to reduce padding | Throughput too low               | You need sample boundaries intact  | Often one of the biggest SFT speedups for short samples           |
| `sft.group_by_length`       |  `true` | Reduce padding waste per batch      | Throughput too low               | Need strict data order             | Improves token efficiency and stabilizes step time                |
| `sft.dataloader_num_workers`|     `2` | Parallelize host-side data loading  | Data pipeline stalls             | Worker overhead dominates          | Moderate CPU-side throughput improvement                           |
| `sft.eval_strategy`         |   `"no"`| Skip per-epoch eval by default      | Need in-run validation curves    | Runtime too high                   | Per-epoch eval can add major overhead                             |
| `sft.save_strategy`         |   `"no"`| Skip per-epoch checkpoint writes    | Need frequent recover points     | Runtime too high / disk churn      | Reduces I/O and checkpoint overhead                               |
| `sft.load_best_model_at_end`| `false` | Disabled when eval is off           | Eval enabled and model selection needed | Runtime priority              | Requires evaluation; keep off in fast profile                     |
| `sft.seed`                  |    `88` | Reproducibility                     | Robustness sweeps                | Reproducibility required           | Different seeds can slightly change outcome                       |
| `sft.logging_steps`         |    `10` | Frequent enough monitoring          | Need tighter diagnostics         | Log overhead/noise                 | Mostly observability, minimal quality effect                      |
| `sft.save_total_limit`      |     `2` | Controls checkpoint storage         | Need more rollback points        | Disk constraints                   | No direct quality impact, affects experiment management           |

## Inference + Quantization Knobs

| Key                            | Default | Role                          | Increase if                                    | Decrease if                             | Performance impact                                              |
| ------------------------------ | ------: | ----------------------------- | ---------------------------------------------- | --------------------------------------- | --------------------------------------------------------------- |
| `inference.max_new_tokens`     |   `128` | Legacy/manual test decode cap | Outputs truncate                               | Outputs too verbose/slow                | Affects latency + length behavior in manual spot checks         |
| `inference.repetition_penalty` |   `1.2` | Reduces looped text           | Repetition appears                             | Output quality degrades/too constrained | Higher values reduce repetition but can hurt fluency            |
| `quantization.block_size`      |    `32` | 4-bit quantizer granularity   | Need better compression/runtime tradeoff tests | Accuracy loss too high                  | Larger blocks usually smaller/faster, potentially less accurate |
| `quantization.accuracy_level`  |     `4` | Mid-high q4 fidelity setting  | q4 quality too low                             | q4 throughput/size priority             | Higher level generally favors accuracy over speed               |

## Evaluation Knobs and Gates

### Sampling + decode

| Key                               | Default | Role                         | Increase if                       | Decrease if                   | Performance impact                                |
| --------------------------------- | ------: | ---------------------------- | --------------------------------- | ----------------------------- | ------------------------------------------------- |
| `evaluation.seed`                 |    `88` | Deterministic case sampling  | Running seed-sensitivity analysis | Need reproducible tracking    | Keep fixed for A/B tuning                         |
| `evaluation.smoke_samples`        |    `50` | Fast CI-style signal per set | Smoke too noisy                   | Smoke runs too slow           | More samples improve confidence, increase runtime |
| `evaluation.full_samples_per_set` |   `300` | Higher-confidence suite      | Need tighter confidence intervals | Runtime too long              | Better estimate of true performance               |
| `evaluation.max_new_tokens`       |   `128` | Eval decode cap              | Responses truncate                | Latency too high or verbosity | Directly shifts quality/latency metrics           |

### Thresholds (pass/fail criteria)

| Key                                         | Default | Effect when raised                  | Effect when lowered  | Recommendation                         |
| ------------------------------------------- | ------: | ----------------------------------- | -------------------- | -------------------------------------- |
| `thresholds.exact_match_rate_min`           |  `0.35` | Stricter lexical match gate         | More permissive      | Keep modest for paraphrastic tasks     |
| `thresholds.token_f1_min`                   |  `0.55` | Stricter semantic overlap           | More permissive      | Primary factual quality gate           |
| `thresholds.keyword_coverage_min`           |  `0.75` | Stricter key-fact coverage          | More permissive      | Good guardrail against partial answers |
| `thresholds.refusal_accuracy_min`           |  `0.90` | Stricter safe-refusal behavior      | More permissive      | Keep high for adversarial/OOD safety   |
| `thresholds.response_length_compliance_min` |  `0.95` | Stricter brevity/style adherence    | More permissive      | Align with product UX constraints      |
| `thresholds.behavior_accuracy_min`          |  `0.92` | Stricter answer-vs-refuse policy    | More permissive      | Useful global behavior gate            |
| `thresholds.fp32_alignment_min`             |  `0.70` | Stricter quantization fidelity gate | More permissive      | Tune alongside latency budgets         |
| `thresholds.case_token_f1_min`              |  `0.25` | More cases marked as failures       | Fewer case failures  | Per-case failure triage sensitivity    |
| `thresholds.case_keyword_coverage_min`      |  `0.40` | More keyword misses flagged         | Fewer misses flagged | Helps failure analysis quality         |

### Latency budgets

| Key                                              | Default ms | Raise if                       | Lower if                    | Performance impact                    |
| ------------------------------------------------ | ---------: | ------------------------------ | --------------------------- | ------------------------------------- |
| `thresholds.p95_latency_ms_max.model.onnx`       |     `2500` | Hardware slower but acceptable | Tight UX/SLA goals          | Controls fp32 acceptance threshold    |
| `thresholds.p95_latency_ms_max.model_int8.onnx`  |     `1800` | Device/browser slower          | Want faster median UX       | Gates int8 runtime viability          |
| `thresholds.p95_latency_ms_max.model_uint8.onnx` |     `1800` | Same as above                  | Same as above               | Gates uint8 runtime viability         |
| `thresholds.p95_latency_ms_max.model_q4.onnx`    |     `1200` | q4 quality priority > speed    | Strict responsiveness goals | Forces q4 to justify deployment value |

### Evaluation metadata knobs

| Key                          | Default                 | Role                                             |
| ---------------------------- | ----------------------- | ------------------------------------------------ |
| `evaluation.report_output`   | `data/eval_reports`     | Output root for timestamped evaluation artifacts |
| `evaluation.eval_data_dir`   | `data/eval`             | Curated eval-set input directory                 |
| `evaluation.refusal_markers` | list of refusal phrases | String heuristics for refusal classification     |
| `evaluation.hub.model_id`    | HF model repo           | Snapshot metadata source (not training behavior) |
| `evaluation.hub.dataset_id`  | HF dataset repo         | Snapshot metadata source (not training behavior) |

## Operational (Non-Quality) Knobs

| Key                                                                           | Purpose                                      |
| ----------------------------------------------------------------------------- | -------------------------------------------- |
| `person_name`, `person_full_name`                                             | Prompt persona grounding for synthetic data  |
| `resume_path`                                                                 | Input resume location                        |
| `dataset_output`, `model_output`, `merged_output`, `onnx_output`              | Artifact paths                               |
| `server.host`, `server.port`, `server.timeout`, `server.health_check_timeout` | llama-server connectivity + timeout behavior |
| `dataset.hub_id`, `model.hub_id`                                              | Hugging Face push targets                    |

## Suggested Tuning Playbook

1. Lock model + seed, generate dataset, run `make train-model` and `make eval-full`.
2. If factuality is weak: raise `samples_per_category`, then adjust `sft.learning_rate` or `sft.epochs`.
3. If overfitting/noisy behavior appears: raise `lora.dropout` or reduce `lora.r`.
4. If quantized variants drift too far: revisit `quantization` knobs and `fp32_alignment_min`.
5. After stable metrics, tighten thresholds gradually to match product requirements.
