# Final Project

An 11-person meme generator project. This README is the entry point — use it to navigate the codebase and the research/process documentation.

## Repository layout

```
.
├── docs/        Research, design, and process documentation
└── src/         Application code
```

## `src/` — code

| Folder | Owner | What goes here |
|--------|-------|----------------|
| [`src/frontend/`](src/frontend/) | Tybalt, Eric | Frontend application code (HTML/CSS/JS, components, UI logic). |
| [`src/backend/database/`](src/backend/database/) | Omar | Database setup, schema, seed scripts, template library. |
| [`src/backend/pipelines/`](src/backend/pipelines/) | 3 competing subteams | Three prototype pipelines for merging a meme template + user image. Each folder is a sandbox holding both prototype code and the subteam's supporting notes. One pipeline will be selected at the end of the sprint and its code promoted into `src/backend/`; the other two will be deleted. |
| `src/backend/pipelines/a/` | Steven + 1 | Pipeline A prototype + notes. |
| `src/backend/pipelines/b/` | Abhay + 1 | Pipeline B prototype + notes. |
| `src/backend/pipelines/c/` | Anlisa, Jennifer, Lorenzo | Pipeline C prototype + notes. |

## `docs/` — documentation

Organized two ways: **by time** (week-by-week meeting cadence) and **by topic** (design, research, architecture, decisions).

| Folder | What goes here |
|--------|----------------|
| [`docs/meetings/`](docs/meetings/) | One folder per week. Each week contains `sprint-planning.md`, `retrospective.md`, and a `standups/` folder with the two mid-week standups. |
| [`docs/design/`](docs/design/) | Personas, user stories, user flow, wireframes. |
| [`docs/research/`](docs/research/) | One-time research deliverables (market research, AI model comparison). |
| [`docs/architecture/`](docs/architecture/) | Living technical docs — current backend architecture, schema, diagrams. |
| [`docs/decisions/`](docs/decisions/) | Architecture Decision Records (ADRs) — one file per consequential decision, capturing *why* we picked what we picked (including the eventual pipeline selection). |
