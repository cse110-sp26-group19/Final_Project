# Code style tooling

**Status:** accepted
**Date:** 2026-05-16

## Decision

Use **Prettier + EditorConfig** as the project's code style baseline.

Operational instructions for contributors live in [`CONTRIBUTING.md`](../../CONTRIBUTING.md#development-setup). This document covers _why_.

## Why

- **Prettier** formats every file type we'll write (HTML, CSS, JS, JSON, Markdown). It's opinionated by design — no per-developer config debates. It also has zero transitive npm dependencies, which keeps `node_modules` minimal.
- **EditorConfig** is editor-native and enforces the basics (indent, line endings, trailing whitespace) at save-time, before Prettier runs. It catches files Prettier doesn't format (`.gitignore`, configs, plain text).

Together they give us: one `npm install`, one `npm run lint` command, identical results on every machine and in CI.

## What we considered and skipped

- **stylelint** — would catch CSS correctness issues Prettier ignores (duplicate properties, invalid units, malformed selectors), but pulls in ~120 transitive npm packages for what is, at our project's scale, a low-value safety net. Revisit if CSS bugs become a recurring problem.
- **Biome** (one-tool formatter + linter) — newer, faster, but CSS support is still maturing and the editor-integration ecosystem is smaller. Worth revisiting later.
- **ESLint with Prettier plugin only** — ESLint is JS-only, so we'd still need Prettier for CSS/HTML/Markdown. The Prettier team itself recommends against running formatting through ESLint (correctness and formatting are different concerns).
- **No tooling at all** — 11 contributors without a shared style is a guaranteed mess, and the course rules require linting/quality checks anyway.

ESLint will get its own ADR once we start writing JavaScript.
