# memebro — AI-assisted meme generator

Put yourself in a meme: pick a template, add your face, and generate a face-swapped meme you can download or share. Built by an 11-person team for CSE 110 (Spring 2026, Group 19).

**🔗 Live site: [memebro.pages.dev](https://memebro.pages.dev)** — no setup needed, just open it.

## Demo

![memebro demo — pick a template, add your face, generate, share](docs/demo.gif)

> _If the demo doesn't show, add a short screen-recording (a few seconds: template → upload → generate → share) at `docs/demo.gif`._

## Videos

| Video          | Link                                                        |
| -------------- | ----------------------------------------------------------- |
| Status Video 1 | [YouTube](https://youtu.be/EMPugYznZpI?si=zMVvOjIs82Qr-8zn) |
| Private Video  | [YouTube](https://youtu.be/ehPdovQsD34)                     |
| Public Video   | [YouTube](https://youtu.be/_gwiINwU1nE)                     |

## How it works

1. **Pick a meme template** (browsed live from Imgflip) — or upload your photo first.
2. **Add your face** (JPG or PNG).
3. **Edit** the caption text and drag it into place on the live preview.
4. **Generate** — your face is swapped onto the template via the Replicate API.
5. **Download** the PNG or **share** the image.

## Run it

The easiest way to use memebro is the **[live site](https://memebro.pages.dev)** — nothing to install.

To run it **locally**:

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer (includes `npm`).
- _(Optional, for face-swap)_ a free [Replicate](https://replicate.com/) API token. Without it the app still works — you can browse templates, add captions, and make text memes; only the AI face-swap step needs the token.

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/cse110-sp26-group19/Final_Project.git
cd Final_Project

# 2. Install dependencies
npm install

# 3. (Optional) enable face-swap — create a .env file with your Replicate token
echo "REPLICATE_API_TOKEN=your_token_here" > .env

# 4. Start the local server
npm start

# 5. Open the app
#    → http://localhost:3000
```

That's it. `npm start` runs a small local server (`src/backend/server.js`) that serves the site and proxies the face-swap request so your API token never reaches the browser.

### Other commands

| Command          | What it does                                           |
| ---------------- | ------------------------------------------------------ |
| `npm test`       | Run the unit test suite (Node's built-in test runner). |
| `npm run lint`   | Lint the code with ESLint.                             |
| `npm run format` | Auto-format the code with Prettier.                    |
| `npm run check`  | Format check + lint + tests (the full CI gate).        |

## Repository layout

```
.
├── src/frontend/   Frontend app — HTML/CSS/JS (pages, components, lib, scripts, styles, assets)
├── src/backend/    Local Express dev server + Replicate client (used by `npm start`)
├── functions/      Cloudflare Pages Functions — the production API (face-swap, image-proxy)
├── tests/          Unit tests (and E2E tests under tests/e2e/)
└── docs/           Research, design, and process documentation
```

The production deployment serves the static frontend and the `functions/` API on **Cloudflare Pages**; `npm start` is the equivalent setup for local development.

## Documentation (`docs/`)

Organized by **time** (week-by-week meetings) and by **topic** (design, research, architecture, decisions).

| Folder                                     | What's inside                                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| [`docs/meetings/`](docs/meetings/)         | One folder per week: sprint planning, retrospectives, and mid-week standups.                     |
| [`docs/design/`](docs/design/)             | Personas, user stories, user flow, wireframes.                                                   |
| [`docs/research/`](docs/research/)         | Research deliverables (market research, AI model comparison).                                    |
| [`docs/architecture/`](docs/architecture/) | Technical docs and diagrams, plus deprecated/archived backend approaches.                        |
| [`docs/decisions/`](docs/decisions/)       | Architecture Decision Records (ADRs) — one file per consequential decision, capturing the _why_. |
