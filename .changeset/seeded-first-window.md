---
"@macrostrat/data-sheet": minor
---

- `initialData` now seeds the store at creation, so the first window is in the first render (server renders included) instead of arriving in an effect
- Provider-backed views no longer have their `data` reset by the provider's init effect; only an in-memory `data` prop is placed there
