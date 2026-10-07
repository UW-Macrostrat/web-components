---
"@macrostrat/column-views": minor
---

Add `IntervalAgeRange`, which shows a span of time as the interval(s) it runs
between. A `flavor` picks what goes with the interval names: positions within
the intervals (`proportion`), ages (`ages`), positions followed by the span's
age range (`both`), or nothing (`none`). An age on its interval's boundary
belongs to the interval and goes in its tag; an age within the interval is the
span's own and follows the tag. `verbose` always prints the position or age,
even where the interval boundary implies it (`Cretaceous | base to top`).
