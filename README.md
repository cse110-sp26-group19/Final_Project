# Final Project

An 11-person meme generator project. This README is the entry point — use it to navigate the codebase and the research/process documentation.

## Videos

| Video | Link |
| ----- | ---- |
| Status Video 1 | [YouTube](https://youtu.be/EMPugYznZpI?si=zMVvOjIs82Qr-8zn) |

## Repository layout

```
.
├── docs/        Research, design, and process documentation
└── src/         Application code
```

## `src/` — code

| Folder                                             | What goes here                                                                                                                                                                                                                                                                  |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`src/frontend/`](src/frontend/)                   | Frontend application code (HTML/CSS/JS, components, UI logic).                                                                                                                                                                                                                  |
| [`src/backend/database/`](src/backend/database/)   | Database setup, schema, seed scripts, template library.                                                                                                                                                                                                                         |
| [`src/backend/pipelines/`](src/backend/pipelines/) | Three prototype pipelines for merging a meme template + user image. Each folder is a sandbox holding both prototype code and supporting notes. One pipeline will be selected at the end of the sprint and its code promoted into `src/backend/`; the other two will be deleted. |
| `src/backend/pipelines/a/`                         | Pipeline A prototype + notes.                                                                                                                                                                                                                                                   |
| `src/backend/pipelines/b/`                         | Pipeline B prototype + notes.                                                                                                                                                                                                                                                   |
| `src/backend/pipelines/c/`                         | Pipeline C prototype + notes.                                                                                                                                                                                                                                                   |

## `docs/` — documentation

Organized two ways: **by time** (week-by-week meeting cadence) and **by topic** (design, research, architecture, decisions).

| Folder                                     | What goes here                                                                                                                                                    |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`docs/meetings/`](docs/meetings/)         | One folder per week. Each week contains `sprint-planning.md`, `retrospective.md`, and a `standups/` folder with the two mid-week standups.                        |
| [`docs/design/`](docs/design/)             | Personas, user stories, user flow, wireframes.                                                                                                                    |
| [`docs/research/`](docs/research/)         | One-time research deliverables (market research, AI model comparison).                                                                                            |
| [`docs/architecture/`](docs/architecture/) | Living technical docs — current backend architecture, schema, diagrams.                                                                                           |
| [`docs/decisions/`](docs/decisions/)       | Architecture Decision Records (ADRs) — one file per consequential decision, capturing _why_ we picked what we picked (including the eventual pipeline selection). |
