# AI Model Recommendation for MemeBro

## Summary

For MemeBro, **Claude Haiku 4.5** is the recommended default model, with Claude Sonnet 4.6 as an optional fallback for more complex generation tasks. This document outlines the reasoning and cost comparison against competing models.

---

## Current Pricing (per million tokens)

| Model | Input | Output | Context Window | Image Input |
|---|---|---|---|---|
| **Claude Haiku 4.5** | $1.00 | $5.00 | 200K | Yes |
| GPT-5.4 Mini | $0.75 | $4.50 | 128K | Yes |
| Gemini 2.5 Flash | $0.30 | $2.50 | 1M | Yes |
| DeepSeek V4 | $0.30 | $0.50 | 64K | No |
| Claude Sonnet 4.6 | $3.00 | $15.00 | 1M | Yes |

---

## Why Claude Haiku 4.5

### 1. Speed matches the project brief

The project spec explicitly states: *"Speed is of the essence, if it takes 5 minutes to respond, you missed your chance."*

Haiku 4.5 generates output at **86 tokens/second** with a **0.74s time-to-first-token** ,4–5× faster than Sonnet 4.5 on comparable tasks. No other model in this tier matches that combination of low latency and response throughput.

### 2. Superior instruction following

Meme caption generation is a pure instruction-following task: match a tone, preserve a format, stay within a character limit. Anthropic's own release data shows Haiku 4.5 outperformed their premium-tier model on instruction-following for text generation tasks, achieving **65% accuracy vs. 44%** from the larger model. That gap is directly relevant to MemeBro.

### 3. Multimodal input (image support)

Users uploading a photo of their friend to insert into a meme require a model that can process image input. Haiku 4.5 supports multimodal (text + image) input natively. **DeepSeek V4 has no image support at all**, which immediately disqualifies it for MemeBro's core use case.

### 4. 90% prompt caching discount

MemeBro will send a system prompt describing meme styles, formatting rules, and tone on every single request. With Anthropic's prompt caching:

- Cached input tokens cost **10% of the standard rate** (90% discount)
- A 500-token system prompt cached across 10,000 requests costs almost nothing
- Effective per-request cost drops well below a fraction of a cent for most generations

This is the most impactful cost lever available, and it is available on Haiku 4.5 at the same discount rate as Sonnet and Opus.

### 5. Performance exceeds its tier

Haiku 4.5 scores **73.3% on SWE-bench Verified**, the industry standard coding benchmark. For context:
- Claude Sonnet 4.6 scores 79.6%
- Claude Opus 4.6 scores 80.8%

Haiku achieves roughly 91% of Opus's benchmark performance at one-fifth the input cost.

---

## Why Not the Alternatives

### GPT-5.4 Mini

GPT-5.4 Mini is slightly cheaper on raw tokens ($0.75 vs $1.00 input) and competitive on speed. However:

- Its cache discount is only ~50%, vs Haiku's 90% ,a significant difference for a system-prompt-heavy app
- It has a 128K context ceiling, half of Haiku's 200K
- Haiku's instruction-following quality edges out Mini for creative/format-constrained text tasks

For MemeBro's workload (cached system prompt + short user input + short caption output), Haiku's caching advantage likely makes it *cheaper in practice* despite higher list-price input rates.

### Gemini 2.5 Flash

Gemini 2.5 Flash is cheaper on raw tokens and offers a 1M context window. However:

- Instruction-following quality is rated as variable, which is a problem for format-constrained meme generation
- The 1M context window is irrelevant for this use case ,meme requests are short
- Gemini's cache discount is approximately 75%, still lower than Haiku's 90%
- Switching to Google's API introduces a separate vendor dependency, separate API key management, and different SDK patterns, adding complexity for minimal gain

### DeepSeek V4

DeepSeek V4 has the cheapest output tokens by a wide margin ($0.50/M). However:

- **No image input support** disqualifying for a meme app where users upload photos
- Slowest response times and lower API reliability among the four options
- Lower instruction-following quality for creative tasks
- A non-starter for real-time, mobile-first use

### Claude Sonnet 4.6

Sonnet 4.6 is a strong model but costs 3× more than Haiku on input and 3× more on output. The quality gap between Haiku and Sonnet on short creative text generation tasks is minimal. Sonnet makes sense as a fallback for edge cases (complex multi-subject meme prompts, unusually long context), but should not be the default.

---

## Estimated Monthly Cost

Assumptions: 10,000 meme generations/month, ~300 input tokens (200 cached system prompt + 100 user input), ~100 output tokens per request.

| Model | Est. Monthly Cost (with caching) |
|---|---|
| Claude Haiku 4.5 | ~$3 |
| GPT-5.4 Mini | ~$7 |
| Gemini 2.5 Flash | ~$4 |
| DeepSeek V4 | ~$1 (but no image support) |
| Claude Sonnet 4.6 | ~$9 |

> These are rough estimates. Actual costs depend on prompt length, output length, and cache hit rate. Always instrument token usage from day one.

---

## Recommended Architecture

Use a two-tier approach:

- **Haiku 4.5** as the default path for all standard meme caption generation, fast, cheap, instruction-following optimized
- **Sonnet 4.6** as an optional upgrade path for power users or complex prompts (e.g., multi-person memes, custom style requests)

This tiered strategy is consistent with how production AI systems are built in 2026 and gives the team something concrete to discuss in interviews and ADRs.

---

## Resume-Worthy Engineering Considerations

The TA specifically called out the following as valuable skills to demonstrate:

- **Prompt caching** ,cache the meme style system prompt; log cache hit rates
- **Token accounting**, track input/output tokens per request and display or log them
- **Prompt storage**, store user-created prompts for reuse across sessions
- **Model routing**, implement logic to escalate from Haiku to Sonnet when needed

All of these should be captured as **Architectural Decision Records (ADRs)** in MADR format in the repository.

---

## Notes

- Image *generation* (e.g., face-swapping a friend into a meme template) requires a separate API such as Stability AI or Replicate. Claude handles text only ,this is a separate dependency that requires TA approval per the project spec.
- Pricing information sourced from official Anthropic documentation and third-party pricing aggregators.
