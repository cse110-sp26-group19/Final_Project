# 0002. Use Replicate API with codeplugtech face-swap model

| Attribute | Value                           |
| --------- | ------------------------------- |
| Date      | `2026-05-21`                    |
| Status    | Accepted                        |
| Deciders  | CSE 110 Group 19 (Backend Team) |

## Context

The project requires face-swap functionality for the meme generator. We need to decide on the backend service and model for performing real-time face swaps. Key constraints:

- **Deployment**: Cloudflare Workers (serverless, lightweight)
- **Scale**: Handle multiple concurrent requests from browser clients
- **Mobile**: Must support iOS/Android browsers
- **Cost**: Limited budget for API calls
- **Development speed**: Need working solution within sprint
- **Accuracy**: Production-quality face swaps for user-generated memes

We evaluated three approaches: self-hosted (FaceFusion), cloud API (Replicate), and edge computing (Cloudflare Workers ML).

## Decision

We will use **Replicate API** (https://replicate.com) with the **codeplugtech/face-swap** model (version hash: `278a81e7ebb22db98bcba54de985d22cc1abeead2754eb1f2af717247be69b34`) for backend face-swap processing.

The backend will expose a POST `/api/swap` endpoint that accepts multipart images, delegates to ReplicateClient for API calls, and returns HTTP URLs to swapped images. Browser detects faces client-side and calls the endpoint for each face region.

## What We Considered and Skipped

**LLMs (OpenAI, Gemini, Claude)**
- Inconsistent results: LLMs are designed for text and general vision tasks, not specialized face-swapping
- Non-deterministic: May refuse to perform face swaps for safety reasons or fail intermittently
- Expensive: LLM API costs ($0.01-0.10+ per call) far exceed specialized face-swap models
- Slow: Token-based processing adds latency compared to image-specialized models
- Not designed for this task: Would require expensive prompt engineering with no guarantee of quality

**FaceFusion (Self-Hosted)**
- Accessibility barriers: Requires local GPU/CPU infrastructure that users/developers don't have available
- Deployment complexity: Need to manage CUDA, PyTorch, model weights, and inference servers
- Scale issues: Can't handle concurrent requests without expensive multi-GPU setup
- DevOps burden: Maintenance, monitoring, and updates fall entirely on team
- Cost hidden: Seems free but requires expensive cloud GPU resources ($0.50-5.00+ per hour) or local hardware
- Not serverless: Incompatible with Cloudflare Workers deployment target
- Model quality: While high-quality, requires significant tuning and optimization effort

## Why Replicate API is Better

**Replicate API** solves all these problems:
- **Specialized**: codeplugtech model is purpose-built for face-swapping with proven accuracy
- **Consistent**: Deterministic results with reliable error handling
- **Cost-effective**: ~$0.01-0.02 per swap vs. $0.50+ for self-hosted GPU compute
- **Serverless**: Designed to integrate with Cloudflare Workers and edge computing
- **Scalable**: Replicate handles GPU allocation and concurrent requests
- **Low friction**: No DevOps required; just call the API and pay per use
- **Production-ready**: Battle-tested model with active maintenance and updates

## Consequences

### Positives

- **No infrastructure**: Replicate handles model hosting, GPU scaling, and model updates
- **Proven model**: codeplugtech model has strong community reputation and accuracy
- **Serverless-compatible**: Replicate API calls work well with Cloudflare Workers
- **Per-request billing**: Pay only for what we use (no fixed costs)
- **Easy integration**: REST API with simple base64 image input/output
- **Mobile-ready**: Browser-based face detection + API calls work on all devices
- **Production quality**: Handles edge cases (lighting, angles, multiple faces)
- **Async polling**: Fits well with user expectations (face swaps take 10-30s)

### Negatives/tradeoffs

- **External dependency**: Reliant on Replicate API uptime and pricing stability
- **API cost**: ~$0.01-0.02 per swap (vs. free if self-hosted, but zero DevOps)
- **Latency**: 10-30 second processing time per face (user must wait or show progress bar)
- **Rate limiting**: Replicate enforces rate limits; multi-face swaps must be sequential
- **No local control**: Can't fine-tune model or modify inference behavior
- **Model versioning**: codeplugtech model may be deprecated/updated by author

### Follow-up

- [x] Implement ReplicateClient wrapper class with error handling
- [x] Add unit tests for API integration
- [x] Create Express server with /api/swap endpoint
- [x] Document API error codes (401, 402, 404, 422, 429)
- [ ] Add integration tests with real Replicate API (requires valid token)
- [ ] Implement rate-limit handling for multi-face swaps (sequential with delays)
- [ ] Add progress indicator UI for long-running swaps
- [ ] Monitor API costs and usage in production
- [ ] Document Replicate account setup in CONTRIBUTING.md
