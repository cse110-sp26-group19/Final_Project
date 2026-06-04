# Temporary demo backend (deprecated)

> **Status: deprecated / archived.** This was a throwaway local server used only for the Week 8 Wednesday MVP demo. It is kept here to show the work — it is **not** part of the production pipeline and is not deployed. The team has since moved to the selected backend (see [Week 9 sprint planning](../../../meetings/week9/sprint-planning.md) and the backend ADRs).

## What it did

A tiny local Node server (`server.js`, no dependencies) that proxied a face-swap request to **Gemini 2.5 Flash Image ("Nano Banana 2")**. The frontend POSTed a meme template URL plus a base64 user photo; the server fetched the template, called Gemini with a face-swap prompt, and returned the generated image as base64.

**Known limitation:** it only worked well for memes with a single, clearly distinct, central face. Multiple faces or off-center faces did not swap reliably — one of the reasons it was only a demo stand-in rather than the real pipeline.

## How it was run (historical)

It required a `GEMINI_API_KEY` environment variable (no key is stored in the code):

```bash
export GEMINI_API_KEY=your_key_here    # from https://aistudio.google.com/apikey
node server.js                          # dev backend on port 3001
```

API contract:

```
POST http://localhost:3001/api/generate
Content-Type: application/json

{ "templateUrl": "https://i.imgflip.com/...", "userImage": "<base64, no data: prefix>" }

→ 200 { "image": "<base64 PNG>" }
→ 500 { "error": "..." }
```
