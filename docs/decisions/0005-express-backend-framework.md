# 0005. Use Express.js for backend API server

| Attribute | Value                           |
| --------- | ------------------------------- |
| Date      | `2026-05-25`                    |
| Status    | Accepted                        |
| Deciders  | CSE 110 Group 19 (Backend Team) |

## Context

The project needs a backend API server to handle face-swap requests, file uploads, and integration with Replicate API. Key constraints:

- **Language**: JavaScript/Node.js (already using in frontend)
- **Deployment**: Should work with Cloudflare Workers and serverless platforms
- **File handling**: Must support multipart form-data uploads (images)
- **Development speed**: Need quick setup and familiar patterns
- **Team expertise**: Team familiar with JavaScript/Node.js
- **Lightweight**: Minimal overhead for serverless compatibility

We evaluated three frameworks: Express.js, Fastify, and Hono.

## Decision

We will use **Express.js** for the backend API server.

Express.js provides a minimal, flexible HTTP server framework with mature middleware ecosystem (multer for file uploads, CORS support). The server will expose REST endpoints: `POST /api/swap`, `GET /health`, `GET /api/status`.

## Consequences

### Positives

- **Mature & stable**: Express is battle-tested with large community and extensive documentation
- **Minimal setup**: Quick to scaffold basic HTTP server with routing
- **Middleware ecosystem**: Rich third-party middleware (multer, cors, compression, etc.)
- **Familiar**: Team already knows JavaScript/Node.js patterns
- **Lightweight**: No unnecessary abstractions; only what we need
- **Serverless-ready**: Works well when deployed to serverless platforms
- **Integration-friendly**: Easy to integrate ReplicateClient wrapper
- **Standard**: Industry-standard choice; easy to hire developers familiar with it

### Negatives/tradeoffs

- **Not opinionated**: Less guidance than opinionated frameworks (requires more decisions)
- **Middleware ordering matters**: Order of middleware setup can cause subtle bugs
- **Error handling**: Async/await error handling requires careful patterns
- **Performance**: Slower than Fastify for high-concurrency workloads (not critical for this project)
- **Boilerplate**: Minimal structure means more code compared to full frameworks

### Alternatives considered

**Fastify**

- Faster performance (not needed at this scale)
- More opinionated structure
- Smaller ecosystem than Express
- Steeper learning curve
- Overkill for single endpoint project

**Hono**

- Lightweight and fast
- Designed for edge computing (Cloudflare Workers)
- Smaller ecosystem than Express
- Less mature than Express
- Would require learning new framework patterns

### Follow-up

- [x] Create Express server with multer for file uploads
- [x] Implement POST /api/swap endpoint
- [x] Add GET /health and GET /api/status endpoints
- [x] Configure CORS for browser/mobile requests
- [x] Serve static generated images via /images route
- [x] Add comprehensive JSDoc documentation
- [ ] Add middleware for request logging (morgan)
- [ ] Add middleware for request validation (joi/zod)
- [ ] Consider rate limiting middleware for production
- [ ] Add graceful shutdown handling
