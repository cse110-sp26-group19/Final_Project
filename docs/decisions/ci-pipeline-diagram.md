# CI Pipeline

Every **push** or **pull request** automatically runs our checks on GitHub Actions.

```mermaid
flowchart TD
    A["Push / Pull Request"] --> B["Install dependencies"]
    B --> C["Format check"]
    C --> D["Run tests"]
    D --> E["Lint (warning only)"]
    E --> F["✅ Pass → merge to main"]
    C -. fail .-> X["❌ CI fails — merge blocked"]
    D -. fail .-> X
```

- **Format** and **tests** must pass — if they fail, the merge is blocked.
- **Lint** is a warning only (it never blocks a merge).
