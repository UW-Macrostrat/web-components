---
"@macrostrat/column-components": patch
---

Give a note the height it measured, and center it on the line that points at
it. Every note measures itself in the same tick, so accumulating the heights
had to go through a state updater — building each from a snapshot meant only
the last one was kept and the layout placed them all at its 10px guess, which
left labels of two lines no room to be two lines. The note's inset is a margin
again, too: as padding it folded into the measured height, so the text sat
half an inset above its connector.
