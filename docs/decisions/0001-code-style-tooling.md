# Code style tooling

**Status:** accepted
**Date:** 2026-05-16

## Decision

Use **Prettier + stylelint + EditorConfig** as the project's code style baseline.

Operational instructions for contributors live in [`CONTRIBUTING.md`](../../CONTRIBUTING.md#development-setup). This document covers _why_.

## Why

- **Prettier** formats every file type we'll write (HTML, CSS, JS, JSON, Markdown). It's opinionated by design — no per-developer config debates.
- **stylelint** catches CSS _correctness_ issues Prettier ignores (duplicate properties, invalid units, malformed selectors). It runs on top of Prettier, not instead of it.
- **EditorConfig** is editor-native and enforces the basics (indent, line endings, trailing whitespace) at save-time, before any formatter runs.

Together they give us: one `npm install`, one `npm run lint` command, identical results on every machine and in CI.
