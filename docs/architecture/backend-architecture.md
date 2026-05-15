# Backend Architecture

## API Style: REST

We are going with a **REST API** over alternatives like GraphQL or gRPC. Key reasons:

- **HTTP-native** — REST maps directly onto standard HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`), meaning no special client libraries are needed. A vanilla JS `fetch()` call is all that's required.
- **Simplicity & familiarity** — REST is the most widely understood API pattern. Every team member can read and contribute to it without learning a query language (GraphQL) or a binary protocol (gRPC).
- **Performance is sufficient** — For a meme generator, we are not doing complex nested queries that would benefit from GraphQL. Simple resource-oriented endpoints (`/memes`, `/generate`, `/upload`) cover all our needs with very low overhead.
- **Tooling ecosystem** — Express.js, Firebase Functions, and most Node.js frameworks have first-class REST support. Debugging tools like Postman, curl, and browser DevTools work out of the box.

---

## Framework Options

### Express.js
- Lightweight, unopinionated Node.js framework
- Full control over routing, middleware, and request/response handling
- Best choice if we want to self-host or deploy on something like Railway, Render, or a VPS
- Pairs well with any database (Firebase, PostgreSQL, MongoDB, etc.)
- Middleware ecosystem (e.g. `multer` for file uploads, `cors`, `helmet` for security) is mature and well-documented
- Downside: requires manual setup for auth, storage, and database — more boilerplate

### Firebase (Functions + Firestore + Storage)
- Backend-as-a-Service (BaaS) — handles auth, database, file storage, and serverless functions in one platform
- Minimal server management — scales automatically
- Firebase Functions expose REST endpoints natively
- **Firestore** stores data as JSON documents, making it easy to store meme metadata, user collections, and token/prompt context
- **Firebase Storage** handles blob storage for images (uploaded photos, generated memes) — no separate S3 setup needed
- **Firebase Auth** gives us Google/email sign-in out of the box with minimal code
- Trade-off: less control, vendor lock-in, costs can scale unexpectedly at high usage

### Supabase
- Open-source Firebase alternative built on top of PostgreSQL
- Provides auth, storage, and a REST API auto-generated from your database schema
- Stronger querying power than Firestore (full SQL via `pg`) — useful if meme/user data gets relational
- Also has blob storage (Supabase Storage) for images
- Self-hostable if we want to avoid vendor lock-in entirely
- Downside: smaller ecosystem than Firebase, less plug-and-play for quick prototyping

---

## Recommendation

We should go with **Firebase** as the primary platform because of it's simplicity and efficiency:

- Firebase handles the heavy lifting: blob storage for uploaded/generated images, Firestore for JSON document storage (meme metadata, user data, prompt/token context), and Auth for user sign-in
- Has great documentation and is super beginner friendly.

## Architecture to Interact with LLMs

We use an LLM (e.g. Gemini or GPT-4o/Sora) to handle image generation. The core idea is that we maintain a **curated library of meme templates**, each personally labeled with structured context describing the visual layout, tone, and text placement zones. This context is what gets sent to the LLM — not the raw image.

### Meme Template Data Structure

Each template entry in our store looks like this:

```json
{
  "IMG_1": {
    "context": "Two-panel meme. Top panel: yellow-tinted scene, person in orange puffer coat looking away in disgust, hand raised to reject something. Text overlaid top-right. Bottom panel: same person now looking forward with approval, pointing fingers outward. Text overlaid bottom-right.",
    "text": null,
    "user_image": null
  }
}
```

- `context` — our hand-written label describing the meme's visual layout and tone. This is what gives the LLM enough understanding to place the user's image and generate fitting text.
- `text` — left null at storage time; populated at request time, either from a preselected caption or LLM-generated output.
- `user_image` — left null at storage time; injected with the user's uploaded image at request time before the payload is sent to the LLM.

> Neither `text` nor `user_image` are stored in the template — they are always filled in dynamically per request.

### Expected LLM Response

```
{
  `image`: generated meme image,
  `text`: suggested caption with recommended placement
}
```

The LLM returns the meme image and the caption **separately**. This is intentional: by keeping them decoupled, we can render the text ourselves on the frontend (via canvas or CSS overlay), letting the user drag and reposition it before saving. The LLM's suggested placement is used as the default starting position, but is not locked in and then we implement the logic to actually place it ourselves on the front end side of things.

### Template Scaling Strategy

We start with a small set of **manually labeled** meme templates at launch. Over time, the library grows via two paths:

1. **User-submitted templates** — Users can upload a new meme image and write their own context label for it.
2. **LLM-assisted labeling** — Alternatively, users upload just the image and an LLM generates the context label automatically, following a predefined set of guardrails (consistent formatting, tone descriptors, text zone identification, etc.).

Either way, new templates go through a validation step before entering the public library to prevent garbage or inappropriate content from polluting the pool.