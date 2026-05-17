# Contributing to the Repository

This project will include bug reports, feature ideas, documentation improvements, and pull requests.

Please read this guide before opening an issue or submitting a pull request.

---

## Before starting:

- Search for existing issues
- Keep issues actionable and focused
- Keep pull requests small and reviewable
- Be respective and constructive when in discussion

---

## Table of Contents:

1. [Development Setup](#development-setup)
2. [Creating Branches](#creating-branches)
3. [Creating Issues](#creating-issues)
4. [Creating PRs](#pull-request-template)

# Development Setup

After cloning the repo, run **once**:

```bash
npm install
```

This installs the dev tooling (Prettier and EditorConfig) so every contributor formats code identically. Rationale for the tool choice lives in [`docs/decisions/0001-code-style-tooling.md`](docs/decisions/0001-code-style-tooling.md).

## Daily workflow

- **Format your code** before committing:
  ```bash
  npm run format
  ```
- **Check formatting** (what CI will run):
  ```bash
  npm run lint
  ```

## Editor setup (strongly recommended)

Install these so formatting happens on save and you never have to think about it:

- **VS Code:**
  - [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
  - [EditorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)
- **JetBrains (WebStorm, IntelliJ):** built-in. Enable Prettier under _Settings → Languages & Frameworks → JavaScript → Prettier_ and tick **"On save"** and **"On 'Reformat Code' action"**.

Once your editor is set up, **enable "Format on save"** in editor settings. After that, write code however you want — the moment you save, Prettier rewrites it to the team standard.

## What each tool does

| Tool             | Purpose                                                                                            |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| **Prettier**     | Formats HTML, CSS, JS, JSON, Markdown (whitespace, quotes, trailing commas, line wrapping, etc.)   |
| **EditorConfig** | Enforces basics at save-time (indent style/size, line endings, trailing whitespace, final newline) |

If `npm run lint` passes locally, it will pass in CI. If it doesn't, your PR will be blocked until it does.

---

# Creating Branches

To keep our repository organized, we will follow a strict branch naming convention.

Every branch must follow this format:
[category]/[issue-number]-[brief-description]

## Branch Categories:

| Prefix      | Type of Work                                              | Example Branch Name                         |
| :---------- | :-------------------------------------------------------- | :------------------------------------------ |
| `feat/`     | New features or functionality (`[frontend]`, `[backend]`) | `feat/40-frontend-meme-generator-ui`        |
| `fix/`      | Bug fixes or resolving broken behavior                    | `fix/88-backend-auth-session-leak`          |
| `docs/`     | Writing, editing, or fixing documentation                 | `docs/12-api-readme-update`                 |
| `devops/`   | CI/CD pipelines, Docker, or infrastructure configs        | `devops/44-gha-node22`                      |
| `test/`     | Adding missing tests or fixing flaky test suites          | `test/201-testing-frontend-dashboard-spec`  |
| `refactor/` | Rewriting/restructuring code without changing logic       | `refactor/67-backend-optimize-image-upload` |
| `chore/`    | Routine tasks (upgrading packages, changing `.gitignore`) | `chore/ui-compress-default-meme-templates`  |

# Creating Issues:

Before opening a new issue, please find a template that best fits your context.

## Issue Template:

- [Documentation (Docs)](#documentation-docs)
- [Backend](#backend-issue)
- [Frontend](#frontend-issue)
- [Testing](#testing-issue)
- [Design/UI](#designui-issue)

---

### Documentation (Docs):

- Use for specific tasks, feature requests, doc bugs, and missing setup guides

**Title**: [docs] Short description of what needs to be done

**Description of the Documentation Issue**:

**Location**:

- File path:
- Section:
- Proposed correction / improvement

---

### Backend Issue:

- Use for server bugs, API failures, database issues, bottlenecks

**Title**: [backend] short description of the bug or feature

**Description of the Issue**:
Steps to Reproduce:

1. First step
2. Second step
3. ...

**Server Logs**:

---

### Frontend Issue:

- Use for UI bugs, layout shifts, component styling, responsiveness issues, visual feature

**Title**: [frontend] Short description of UI bug or visual feature

**Frontend Issue Description**:
**Steps to reproduce**:

**Expected vs. Actual Behavior**:

- Expected:
- Actual:

**Screenshots (optional)**:

---

### Testing Issue:

- Use for testing failures

**Title**: [testing] Short description of test failure

**Test File Path**: insert the file path

**Failing Case**: the output of the failing case

---

### Design/UI Issue:

- Use for design system inconsistencies or potential features
  **Title**: [design] Short description of visual misalignment or features

**Description**: Describe the UI issue

**Suggestions**: Describe suggested improve & how it could be improve

---

# Pull Request Template:

Please use this template when submitting a pull request. Make sure the PR title matches the format of the issue it fixes.

## Summary

Describe the purpose of this PR.

## Changes

- Added ...
- Updated ...
- Fixed ...

## How to test/repro

1. ...
2. ...
3. ...

## Screenshots (optional)

Add screenshots if needed

## Checklist

- [ ] Tested locally
- [ ] Added/updated tests
- [ ] Documentation updated if needed

## Related Issues

Closes #
