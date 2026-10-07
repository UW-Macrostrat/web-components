---
"@macrostrat/data-components": minor
---

Add `IntervalAgeRange`, which shows a span of time as the interval(s) it runs
between. A `flavor` picks what goes with the interval names: positions within
the intervals (`proportion`), ages (`ages`), positions and ages together
(`both`), or nothing (`none`). Positions, and ages on an interval's boundary, go
in the details of the interval's tag; an age within the interval is the span's
own and follows the tag. Ages always print when the flavor includes them;
`verbose` also prints positions where an interval boundary implies them
(`Cretaceous | base to top`).
