---
"@macrostrat/feedback-components": patch
---

Fix `autoSelect` being cleared on mount under React StrictMode. 2.3.0's "new input replaces the working tree" effect used a first-run ref flag, but StrictMode invokes an effect, cleans it up, and invokes it again on mount — so the second invocation replaced the tree and discarded the mount-time selection. The effect now compares the tree identity it last rendered, which is idempotent under double invocation.
