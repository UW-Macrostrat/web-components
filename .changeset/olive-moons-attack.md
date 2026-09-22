---
"@macrostrat/data-components": minor
---

Add `ExpansionPanelAccordion`, a container for a stack of `ExpansionPanel`s
whose headers stay on screen: each pins to the top of the scrolling container
once its section has scrolled past, and waits at the bottom until its section is
reached. Opening a section scrolls it up to the top of the stack, so a header
waiting at the bottom edge reveals its content rather than expanding below the
fold.
