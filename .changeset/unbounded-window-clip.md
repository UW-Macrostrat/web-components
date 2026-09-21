---
"@macrostrat/column-views": patch
---

Treat an unset age or depth bound as unbounded rather than as a real one. A
`null` `t_age` is the ordinary way to say "no window" — it is what clearing a
window leaves behind — and columns laid out with a hybrid scale, which clip
before laying out, were dropping every unit when they saw one.
