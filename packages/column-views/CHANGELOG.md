# Changelog

## [3.12.2] - 2026-09-25 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.12.1...@macrostrat/column-views-v3.12.2)

### Patch Changes

- Fix unit ordering for height axes
  [bdcb8223](https://github.com/UW-Macrostrat/web-components/commit/bdcb82232b87da5b1dbb922c9258b24eba66529c)
- Add a default sectionOptions that increases scale when sections are zoomed
  [bdcb8223](https://github.com/UW-Macrostrat/web-components/commit/bdcb82232b87da5b1dbb922c9258b24eba66529c)
- Updated dependencies
  [bdcb8223](https://github.com/UW-Macrostrat/web-components/commit/bdcb82232b87da5b1dbb922c9258b24eba66529c)
  - @macrostrat/data-provider@1.4.1

## [3.12.1] - 2026-09-25 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.12.0...@macrostrat/column-views-v3.12.1)

### Patch Changes

- - `Proportion`, `AgeLabel` and `getAge` are re-exported from
    `@macrostrat/data-components`; surface calibration tags use `IntervalTag`'s
    `proportion`
    [5be3d4c9](https://github.com/UW-Macrostrat/web-components/commit/5be3d4c9f3fcf4442720a7ed3bdb72abca4db4ab)
- Updated dependencies
  [5be3d4c9](https://github.com/UW-Macrostrat/web-components/commit/5be3d4c9f3fcf4442720a7ed3bdb72abca4db4ab)
- Updated dependencies
  [dc1feb79](https://github.com/UW-Macrostrat/web-components/commit/dc1feb7961e6f901fe6a3dbb2d3f3bdba03cc32c)
  - @macrostrat/data-provider@1.4.0
  - @macrostrat/data-components@1.7.0

## [3.12.0] - 2026-09-21 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.11.0...@macrostrat/column-views-v3.12.0)

### Minor Changes

- Reduce the options that set how tall a column draws to the few that say
  [0614432f](https://github.com/UW-Macrostrat/web-components/commit/0614432fe94bfd2c222375b9add8f7ac100e33c3)
  different things. They all resolve to one quantity — density, the pixels given
  to one unit of the axis.

  `targetUnitHeight` is the usual knob: room for a typical unit, now the
  geometric mean of the visible units' extents rather than their arithmetic
  mean, which a few long units skew far above anything on screen.
  `minSectionHeight` and `minPixelScale` floor it for legibility. `pixelScale`
  is the alternative: a density stated outright, which is then the density — the
  floors no longer apply to it, since they would undo the scale you stated, and
  `Column` no longer adjusts them behind the scenes. It is quoted in whatever
  the axis measures, so `pixelsPerMyr` and `pixelsPerMeter` spell it per axis,
  the way `t_age` and `t_pos` already do for the window: both can be held at
  once and the axis picks, since useful values for the two differ by orders of
  magnitude. `sectionOptions` decides any of these per section, given what the
  section holds.

  `heightMultiplier` is gone — asking for more room per unit is the same
  control, and leaves the legibility floors where they belong — as is the
  internal `visibleWindow`, which only restated `t_age`/`b_age`.

- Add a surfaces view for a column's age model. `ColumnSurfaces`, dropped into a
  [ea700ff1](https://github.com/UW-Macrostrat/web-components/commit/ea700ff1e7725703d971e3cac440fad0f7540a65)
  `Column` as a child, draws the column's calibration surfaces from the
  `/age_model` route as lines across the units (`ColumnSurfaceLines`) and as a
  collision-avoiding notes column of labels beside them (`ColumnSurfaceLabels`),
  styled by `boundary_status` and `boundary_type`, with hover and selection.
  Labels use the standard `IntervalTag` for the calibration interval (with the
  position within it) over the modeled age, are drawn by default only for the
  tie points where the age model was constrained (absolute, relative, spike,
  imposed — `labelStatuses` widens this), and take the label column over from
  the unit labels while mounted (`useClaimLabelColumn`, a new way for a column's
  children to claim that space). `SurfaceDetailsPanel` inspects a selected
  surface — model age, calibration interval and position within it, the units it
  separates, provenance — and `SurfaceStatusLegend` explains the line styles.

  The view is data-agnostic: `useColumnAgeModel` fetches boundaries through the
  `MacrostratDataProvider` base URL (the old overlay hardcoded the dev server),
  `surfacesFromBoundaries` maps them to `ColumnSurface` records, and
  `surfacesFromUnits` derives surfaces from unit tops and bottoms as the
  fallback for columns without `unit_boundaries` (or for an editor's own state).
  `BoundaryAgeModelOverlay` and `ComputedSurfacesOverlay` remain as deprecated
  wrappers. `ColumnNotes` gains `onClickNote` and `className` passthroughs.

  `@macrostrat/api-types` gains `AgeModelBoundary` and the `BoundaryStatus` /
  `BoundaryType` vocabularies, mirroring the database enums.

- Draw several timescales beside a column. A new `timescales` prop takes them in
  [1b694ccf](https://github.com/UW-Macrostrat/web-components/commit/1b694ccfcc40321a6edc609b8c07106a87164a3b)
  order, each a Macrostrat timescale ID or a timescale carrying its own
  intervals, levels and label — the international timescale is one of these
  rather than a special case. Clicks and per-interval styles report which
  timescale they came from, so the same interval drawn in two of them can be
  told apart, and `useTimescaleZoom` treats a click in another timescale as
  moving the selection rather than zooming out. Timescales are fetched in one
  place rather than once per section.
- Suppress unit labels below a pixel height, rather than labeling units too thin
  [0614432f](https://github.com/UW-Macrostrat/web-components/commit/0614432fe94bfd2c222375b9add8f7ac100e33c3)
  to see: `labelSuppressHeight` on `Column`, 2px by default. A gap between
  sections is also labeled in the units of the axis, so a drill core reads
  metres rather than Myr.
- One selection color across a column: `--column-selection-color` (the accent
  [1b694ccf](https://github.com/UW-Macrostrat/web-components/commit/1b694ccfcc40321a6edc609b8c07106a87164a3b)
  color, purple) drives both the unit selection overlay — now a box with an
  outline and a light wash, rather than a heavy red fill — and the surface
  selection.

  Surface lines are drawn at a constant weight; status shows in the dash pattern
  and color. A selected surface is outlined as a box, keeping its interval color
  inside, and a selected label bolds its interval tag rather than sitting in a
  card.

  `useTimescaleZoom`: shift-clicking a timescale interval widens the window to
  take it in, instead of moving the window to it. `selectedIntervals` reports
  everything in the selection; all of them are styled as selected.

  `CompositeTimescale` takes a `timescaleID` (which timescale the leveled column
  draws) and `additionalTimescales` (further timescales drawn as extra level
  columns beside it, against the same section scales), and is exported. `Column`
  passes `additionalTimescales` through: narrow `timescaleLevels` by as many to
  swap the finest international level for a regional one rather than widen the
  timescale.

  `heightMultiplier` on `Column` multiplies the heights the layout works out by
  a fixed factor. The scaling approach is unchanged — density still comes from
  `targetUnitHeight` and the section floors — so sections keep their proportions
  and only the size changes; unconformity gaps and `windowPadding`, being chrome
  rather than scale, stay put.

- Infer `relative` status for age-model surfaces that cannot have been
  [c17e6379](https://github.com/UW-Macrostrat/web-components/commit/c17e637909bbff76f7bbf4366134b0ba5c5f59ef)
  interpolated: those sitting on the base or top of their calibration interval,
  and the edges of gap-bound packages (the youngest surface in a section with no
  unit above, or the oldest with none below). `boundary_status` records many of
  these as `modeled`, so filtering to the tie-point statuses was hiding real tie
  points. `inferTiePointStatuses` promotes them client-side and marks the result
  `statusInferred`, which `SurfaceStatusTag` shows. On by default;
  `inferTiePoints: false` on `ColumnSurfaces`, `useColumnSurfaces` or
  `surfacesFromBoundaries` takes the data as recorded.

  Fix surface lines drifting out of alignment with the units column: the overlay
  measured its position once and only re-measured on its own resize, so a
  sibling changing width — the timescale, once its intervals load — left it
  stale.

- Color age-model surfaces by the interval they are calibrated against: the
  [acc9f478](https://github.com/UW-Macrostrat/web-components/commit/acc9f4782cbae65bfe017aa195e1b51456871822)
  surface line and its label's leader line both take the interval's color, and
  the lines are drawn a little heavier. The label's endpoint marker is gone —
  the leader now runs into the surface line itself.

  `SurfaceDetailsPanel` accepts a `null` surface and renders an empty state, so
  a panel bound to a selection doesn't have to be guarded by its caller.

- Add `useTimescaleZoom`: click-to-zoom navigation over geologic time, extracted
  [af6d14e1](https://github.com/UW-Macrostrat/web-components/commit/af6d14e1da59af8d09712ed5cb750b1b6bca7cc8)
  from the Interval zoom story. Clicking a timescale interval animates the
  rendered age window to it, clicking the interval you are in zooms back out a
  level, and the timescale's level window slides with the selection so finer
  intervals come into reach as you drill. `columnProps` spreads the window, the
  levels, the click handler and the selected-interval styling onto a `Column`.
  `unitsAgeExtent` derives the full extent from a set of units.

### Patch Changes

- Notes columns re-run their force layout once the notes' rendered heights have
  [7252f222](https://github.com/UW-Macrostrat/web-components/commit/7252f22207f63d57ef91172cf898f6b27c38725a)
  been measured. The first layout ran on a 10px guess per note and was never
  revisited, so notes taller than that (interval tags, two-line labels)
  overlapped their neighbors. `ColumnNotes` also passes `forceOptions` through
  to the layout.
- Treat an unset age or depth bound as unbounded rather than as a real one. A
  [0614432f](https://github.com/UW-Macrostrat/web-components/commit/0614432fe94bfd2c222375b9add8f7ac100e33c3)
  `null` `t_age` is the ordinary way to say "no window" — it is what clearing a
  window leaves behind — and columns laid out with a hybrid scale, which clip
  before laying out, were dropping every unit when they saw one.
- Judge an unconformity against the finer of the two scales it falls between,
  [aa4fda55](https://github.com/UW-Macrostrat/web-components/commit/aa4fda557137cdb652cb3ddce98d1b5dae8109ef)
  rather than the coarser one. A gap has no density of its own, and taking the
  smaller estimate let a sparse neighbor speak for one the other neighbor would
  have drawn many times larger — a 16 Myr hiatus read as 26px against one
  section and 166px against the other, and collapsed.
- Updated dependencies
  [ea700ff1](https://github.com/UW-Macrostrat/web-components/commit/ea700ff1e7725703d971e3cac440fad0f7540a65)
- Updated dependencies
  [1b694ccf](https://github.com/UW-Macrostrat/web-components/commit/1b694ccfcc40321a6edc609b8c07106a87164a3b)
- Updated dependencies
  [1b694ccf](https://github.com/UW-Macrostrat/web-components/commit/1b694ccfcc40321a6edc609b8c07106a87164a3b)
- Updated dependencies
  [acc9f478](https://github.com/UW-Macrostrat/web-components/commit/acc9f4782cbae65bfe017aa195e1b51456871822)
- Updated dependencies
  [aa4fda55](https://github.com/UW-Macrostrat/web-components/commit/aa4fda557137cdb652cb3ddce98d1b5dae8109ef)
- Updated dependencies
  [af6d14e1](https://github.com/UW-Macrostrat/web-components/commit/af6d14e1da59af8d09712ed5cb750b1b6bca7cc8)
- Updated dependencies
  [7252f222](https://github.com/UW-Macrostrat/web-components/commit/7252f22207f63d57ef91172cf898f6b27c38725a)
- Updated dependencies
  [1b694ccf](https://github.com/UW-Macrostrat/web-components/commit/1b694ccfcc40321a6edc609b8c07106a87164a3b)
  - @macrostrat/api-types@1.4.0
  - @macrostrat/data-provider@1.3.1
  - @macrostrat/timescale@3.3.0
  - @macrostrat/column-components@2.2.0
  - @macrostrat/stratigraphy-utils@1.4.2

## [3.11.0] - 2026-09-04 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.10.0...@macrostrat/column-views-v3.11.0)

### Minor Changes

- Add `AgeWindowTag`, a compact, clearable indicator of the age window a column
  or
  [0dfa4399](https://github.com/UW-Macrostrat/web-components/commit/0dfa4399e47298a2cb37aafa5785149a5f5b994d)
  correlation chart is focused on — an interval tag with its range (or the
  refined range when the window is narrower than the interval), or a bare age
  range — for use in a chart's `axisTopContent` or page chrome.

  Add `intervalShortFromTimescale`, adapting the `Interval` delivered by a
  `Timescale` click (`eag`/`lag`/`nam`/`col`) to the `IntervalShort` shape the
  `@macrostrat/data-components` tags take.

  Add `timescaleIntervalStyle` to `CorrelationChart`, forwarding a per-interval
  style to its timescale so the selected interval can be highlighted, matching
  the existing `Column` prop.

## [3.10.0] - 2026-09-01 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.9.0...@macrostrat/column-views-v3.10.0)

### Minor Changes

- Improve the internal structure of the correlation map store
  [4738d3df](https://github.com/UW-Macrostrat/web-components/commit/4738d3df1bdec8f4b233af215cadc0422ed562e8)
- Created the @macrostrat/map-views module for specific map interactions and
  [4738d3df](https://github.com/UW-Macrostrat/web-components/commit/4738d3df1bdec8f4b233af215cadc0422ed562e8)
  high-level views around Macrostrat maps.

### Patch Changes

- Improve the rendering of correlation chart units
  [4738d3df](https://github.com/UW-Macrostrat/web-components/commit/4738d3df1bdec8f4b233af215cadc0422ed562e8)
- Updated dependencies
  [4738d3df](https://github.com/UW-Macrostrat/web-components/commit/4738d3df1bdec8f4b233af215cadc0422ed562e8)
- Updated dependencies
  [03860266](https://github.com/UW-Macrostrat/web-components/commit/038602669f6d71fed4b847cd55c9d7c32885c054)
- Updated dependencies
  [4738d3df](https://github.com/UW-Macrostrat/web-components/commit/4738d3df1bdec8f4b233af215cadc0422ed562e8)
  - @macrostrat/map-views@1.0.0
  - @macrostrat/scoped-store@1.1.0
  - @macrostrat/stratigraphy-utils@1.4.0
  - @macrostrat/api-types@1.3.0

## [3.9.0] - 2026-08-25 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.8.0...@macrostrat/column-views-v3.9.0)

### Minor Changes

- Add `useAnimatedAgeWindow`: animates a column/correlation-chart's rendered
  `t_age`/`b_age` for smooth pan-and-contract navigation at constant
  `pixelScale` (density), driving the existing clipping + zig-zag unit edges. It
  runs on the shared `useAnimatedDomain` core from `@macrostrat/timescale`.
  Threads `isTransitioning` / `hideLabelsWhileTransitioning` flags through
  `Column`/`CorrelationChart` → `ColumnProvider`; labels stay visible through
  the animation by default, with an opt-in toggle to hide them. New stories for
  the correlation chart and a single stratigraphic column, each with a
  fixed-`pixelScale` variant and a label-hiding toggle.
  [0247a5a2](https://github.com/UW-Macrostrat/web-components/commit/0247a5a2e12062fdb5e586b4b5dca9c3c6490127)

  Add `windowPadding` (px): how much of the sections abutting the rendered
  `t_age`/`b_age` window to reveal, so neighboring stratigraphy — and its
  timescale intervals — stay visible and navigable when zoomed in. Available on
  `Column` and `CorrelationChart`.

  Unit density is now derived from the units the rendered window actually shows,
  measured by their visible duration — so `targetUnitHeight` describes the units
  on screen at any zoom depth, rather than the containing section's overall
  average. A section the window doesn't reach falls back to its own units at
  full duration and is drawn at its own scale. This removes the need for any
  zoom-factor input: clipping shortens visible durations, which raises density,
  so a column renders identically whether a window was animated to or set
  directly.

  Age columns now lay every section out at its **full extent** and apply the
  rendered window as the last step, rather than clipping units and section
  bounds up front. A section abutting the window therefore keeps its own density
  and `minSectionHeight`, and is then trimmed to exactly the requested sliver —
  previously such a fragment had its density re-derived from the few units that
  survived the clip and was re-inflated to the floor, with its scale stretched
  to match. Sections clipped by the window itself still honor
  `minSectionHeight`, expanding their scale rather than rendering a sliver; only
  the padding margin past the window renders at exactly its requested pixels.
  Those final densities are resolved before the padding budget is spent, so a
  margin measures the pixels requested rather than those pixels times whatever
  stretch its neighbor needed — otherwise a short interval (a Holocene beside a
  Pleistocene) is swallowed by its own margin. This also makes `windowPadding`
  exact (it is spent against real section pixel heights; unconformity gaps
  aren't charged, so padding smaller than `unconformityHeight` can still reach
  across one) and stops unconformity-collapse decisions from shifting as the
  window moves. Hybrid and externally-supplied scales keep the previous
  clip-then-lay-out path.

  Stabilize composite-scale package keys (positional index instead of
  `package-${b_age}-${t_age}`) so the correlation chart's packages, columns, and
  timescale reconcile instead of remounting on every animation frame. Unit
  labels re-fit when a transition settles (via `SizeAwareLabel`'s
  `remeasureKey`), not on intermediate frames.

  `Column` now forwards `onClickTimescaleInterval` and `timescaleIntervalStyle`
  to its composite timescale (via `CompositeTimescale`'s new
  `onClickInterval`/`intervalStyle` props), so a standalone column supports
  click-to-zoom interval navigation and per-interval styling (e.g. bolding the
  selected interval).

  Add an interval-zoom story (grouped with the other animation stories under
  `Column views/Column animations`): clicking a timescale interval animates the
  window to it, a preceding/postdating interval moves along the timescale, and
  clicking the selected interval zooms out a level. The timescale shows a fixed
  3-level window that slides with the selected interval's rank (always one
  coarser level to navigate up, one finer to drill down), independent of the
  layout. `targetUnitHeight`, `minSectionHeight` and `windowPadding` are plain
  display controls — there is no zoom-level input.

### Patch Changes

- Fix two zoom-sync issues exposed by animated age-window zoom:
  [0247a5a2](https://github.com/UW-Macrostrat/web-components/commit/0247a5a2e12062fdb5e586b4b5dca9c3c6490127)

  - Age-axis (`AgeAxis`) now redraws when the scale's domain/range changes (not
    just its object identity), and builds a fresh d3 axis generator each render.
    Reusing the generator retained stale `.tickValues()` config, so a section
    that was short (explicit first/last ticks) and later stretched kept those
    out-of-domain tick values — leaving some axes with no labels. Both surfaced
    once stable React keys stopped the axis remounting per frame.
  - The inline-label/note tracker (`LabelTrackerProvider`) re-syncs to the
    _current_ visible unit set on zoom. Its stale gate froze the "unlabeled" set
    once the unit set changed, so a unit whose label now fit inline also kept
    rendering as a note; it now recomputes over current units.

- Updated dependencies
  [0247a5a2](https://github.com/UW-Macrostrat/web-components/commit/0247a5a2e12062fdb5e586b4b5dca9c3c6490127)
- Updated dependencies
  [0247a5a2](https://github.com/UW-Macrostrat/web-components/commit/0247a5a2e12062fdb5e586b4b5dca9c3c6490127)
- Updated dependencies
  [0247a5a2](https://github.com/UW-Macrostrat/web-components/commit/0247a5a2e12062fdb5e586b4b5dca9c3c6490127)
- Updated dependencies
  [0247a5a2](https://github.com/UW-Macrostrat/web-components/commit/0247a5a2e12062fdb5e586b4b5dca9c3c6490127)
- Updated dependencies
  [0247a5a2](https://github.com/UW-Macrostrat/web-components/commit/0247a5a2e12062fdb5e586b4b5dca9c3c6490127)
  - @macrostrat/timescale@3.2.0
  - @macrostrat/column-components@2.1.0
  - @macrostrat/ui-components@5.2.0
  - @macrostrat/map-styles@2.2.7

## [3.8.0] - 2026-08-02 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.7.0...@macrostrat/column-views-v3.8.0)

### Minor Changes

- Move Identifier and UnitIdentifier to `@macrostrat/data-components`
  [91fcea53](https://github.com/UW-Macrostrat/web-components/commit/91fcea536dd55e387b6f5bce1da0c07395da4635)

### Patch Changes

- Remove some unnecessarily bundled packages
  [930edeae](https://github.com/UW-Macrostrat/web-components/commit/930edeaef23d42d62ee3f533d2e20c75dbf9ea42)
- Updated dependencies
  [1961f84a](https://github.com/UW-Macrostrat/web-components/commit/1961f84a397a341ce92eb032dcdc77c79f957707)
- Updated dependencies
  [930edeae](https://github.com/UW-Macrostrat/web-components/commit/930edeaef23d42d62ee3f533d2e20c75dbf9ea42)
- Updated dependencies
  [91fcea53](https://github.com/UW-Macrostrat/web-components/commit/91fcea536dd55e387b6f5bce1da0c07395da4635)
  - @macrostrat/data-components@1.5.0
  - @macrostrat/column-components@2.0.10
  - @macrostrat/mapbox-react@3.3.3

## [3.7.0] - 2026-07-30 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.6.1...@macrostrat/column-views-v3.7.0)

### Minor Changes

- - Improve column correlation chart to support more options
    [b21ea1fc](https://github.com/UW-Macrostrat/web-components/commit/b21ea1fc297a5449a91997b3d97ff3509e8cd824)
  - Create a new column reorganization draggable control
  - Update data provider for intervals fetching

### Patch Changes

- Updated dependencies
  [b21ea1fc](https://github.com/UW-Macrostrat/web-components/commit/b21ea1fc297a5449a91997b3d97ff3509e8cd824)
- Updated dependencies
  [b21ea1fc](https://github.com/UW-Macrostrat/web-components/commit/b21ea1fc297a5449a91997b3d97ff3509e8cd824)
- Updated dependencies
  [b21ea1fc](https://github.com/UW-Macrostrat/web-components/commit/b21ea1fc297a5449a91997b3d97ff3509e8cd824)
  - @macrostrat/map-interface@2.3.1
  - @macrostrat/mapbox-react@3.3.2
  - @macrostrat/data-components@1.4.1
  - @macrostrat/data-provider@1.2.0
  - @macrostrat/timescale@3.1.6

## [3.6.1] - 2026-07-28 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.6.0...@macrostrat/column-views-v3.6.1)

### Patch Changes

- Fix regression in unit selection

## [3.6.0] - 2026-07-28 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.5.1...@macrostrat/column-views-v3.6.0)

### Minor Changes

- Remove createStateIsolation and associated exports from
  `@macrostrat/data-components`; move them to `@macrostrat/scoped-store`.

### Patch Changes

- Updated dependencies
  - @macrostrat/data-components@1.4.0
  - @macrostrat/scoped-store@1.0.1

## [3.5.1] - 2026-05-27 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.5.0...@macrostrat/column-views-v3.5.1)

### Patch Changes

- Improve code for section merging
  [14bde559](https://github.com/UW-Macrostrat/web-components/commit/14bde559db68f21beb0e0a58d57db03bf6e68e69)
- Added a story for correlation diagram creation
  [67fba54a](https://github.com/UW-Macrostrat/web-components/commit/67fba54a699a925f1bf5595051c9831dc789a4db)
- Updated dependencies
  [89bb4be0](https://github.com/UW-Macrostrat/web-components/commit/89bb4be0d6ae6a73ac22d47cb3d9f12964a05e36)
  - @macrostrat/timescale@3.1.5

## [3.5.0] - 2026-05-24 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.4.2...@macrostrat/column-views-v3.5.0)

### Minor Changes

- Createa a basic ColumnRef interface

### Patch Changes

- Updated dependencies
- Updated dependencies
  - @macrostrat/data-components@1.1.12
  - @macrostrat/data-provider@1.1.0

## [3.4.2] - 2026-05-22 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.4.1...@macrostrat/column-views-v3.4.2)

### Patch Changes

- Fix interval provision for timescales
- Updated dependencies
  - @macrostrat/data-provider@1.0.5
  - @macrostrat/timescale@3.1.4

## [3.4.1] - 2026-05-22 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.4.0...@macrostrat/column-views-v3.4.1)

### Patch Changes

- Remove stray console log statements
- Updated dependencies
  - @macrostrat/data-components@1.1.11

## [3.4.0] - 2026-05-20 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.3.5...@macrostrat/column-views-v3.4.0)

### Minor Changes

- Update layout for column units overlaps
  [01048d6f](https://github.com/UW-Macrostrat/web-components/commit/01048d6ffa1335f58334c5c855b86e7a97b3e9c1)

### Patch Changes

- Fixed error with strat name viewer
  [239c0292](https://github.com/UW-Macrostrat/web-components/commit/239c0292ce143f642cf05ec934f246798d89a54f)
- Update blueprintjs dependencies
  [239c0292](https://github.com/UW-Macrostrat/web-components/commit/239c0292ce143f642cf05ec934f246798d89a54f)
- Improved types for API outputs
  [225ed9a4](https://github.com/UW-Macrostrat/web-components/commit/225ed9a4534b2d1f8be8af6ab7e4035352825614)
- Updated `jotai` and `jotai-scope` dependencies
  [fb1c5ceb](https://github.com/UW-Macrostrat/web-components/commit/fb1c5ceb37c59aba5ee8dab1cca1d7a09b5b5fb3)
- Updated dependencies
  [239c0292](https://github.com/UW-Macrostrat/web-components/commit/239c0292ce143f642cf05ec934f246798d89a54f)
- Updated dependencies
  [239c0292](https://github.com/UW-Macrostrat/web-components/commit/239c0292ce143f642cf05ec934f246798d89a54f)
- Updated dependencies
  [225ed9a4](https://github.com/UW-Macrostrat/web-components/commit/225ed9a4534b2d1f8be8af6ab7e4035352825614)
- Updated dependencies
  [01048d6f](https://github.com/UW-Macrostrat/web-components/commit/01048d6ffa1335f58334c5c855b86e7a97b3e9c1)
- Updated dependencies
  [fb1c5ceb](https://github.com/UW-Macrostrat/web-components/commit/fb1c5ceb37c59aba5ee8dab1cca1d7a09b5b5fb3)
  - @macrostrat/data-provider@1.0.4
  - @macrostrat/column-components@2.0.8
  - @macrostrat/data-components@1.1.10
  - @macrostrat/map-interface@2.2.6
  - @macrostrat/ui-components@5.0.10
  - @macrostrat/mapbox-react@3.2.2
  - @macrostrat/api-types@1.2.0
  - @macrostrat/stratigraphy-utils@1.3.0
  - @macrostrat/map-styles@2.2.3

## [3.3.5] - 2026-05-19 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.3.4...@macrostrat/column-views-v3.3.5)

### Patch Changes

- Improved typescript type bundling across the board
  [75fe675c](https://github.com/UW-Macrostrat/web-components/commit/75fe675cdb93e79dd28291d8769c1a38d2eb21b0)
- Updates to internal typings
  [3500ef98](https://github.com/UW-Macrostrat/web-components/commit/3500ef9884da7a5feee8e1d42a885531d5e2addf)
- Updated dependencies
  [75fe675c](https://github.com/UW-Macrostrat/web-components/commit/75fe675cdb93e79dd28291d8769c1a38d2eb21b0)
- Updated dependencies
  [3500ef98](https://github.com/UW-Macrostrat/web-components/commit/3500ef9884da7a5feee8e1d42a885531d5e2addf)
  - @macrostrat/column-components@2.0.7
  - @macrostrat/data-components@1.1.9
  - @macrostrat/data-provider@1.0.3
  - @macrostrat/map-interface@2.2.5
  - @macrostrat/ui-components@5.0.9
  - @macrostrat/api-types@1.1.6
  - @macrostrat/color-utils@1.2.2
  - @macrostrat/map-styles@2.2.2
  - @macrostrat/mapbox-react@3.2.1
  - @macrostrat/mapbox-utils@1.7.4
  - @macrostrat/stratigraphy-utils@1.2.2
  - @macrostrat/svg-map-components@2.0.3
  - @macrostrat/timescale@3.1.3

## [3.3.4] - 2026-05-11 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.3.3...@macrostrat/column-views-v3.3.4)

### Patch Changes

- Simplify handling of nested scoped stores
- Updated dependencies
  - @macrostrat/data-components@1.1.8

## [3.3.3] - 2026-04-05 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.3.2...@macrostrat/column-views-v3.3.3)

### Patch Changes

- Updated `@macrostrat/hyper` dependency
  [6e9a6654](https://github.com/UW-Macrostrat/web-components/commit/6e9a665456460b31c30316a2a13d41abed94c43a)
- Updated dependencies
  [6e9a6654](https://github.com/UW-Macrostrat/web-components/commit/6e9a665456460b31c30316a2a13d41abed94c43a)
  - @macrostrat/svg-map-components@2.0.2
  - @macrostrat/column-components@2.0.6
  - @macrostrat/data-components@1.1.5
  - @macrostrat/data-provider@1.0.2
  - @macrostrat/map-interface@2.2.3
  - @macrostrat/ui-components@5.0.7
  - @macrostrat/mapbox-react@3.1.3
  - @macrostrat/timescale@3.1.2
  - @macrostrat/map-styles@2.1.2

## [3.3.2] - 2026-04-04 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/column-views-v3.3.1...@macrostrat/column-views-v3.3.2)

### Patch Changes

- Updated [BlueprintJS](https://blueprintjs.com) dependencies to latest `6.x.x`
  series
  [fa23ec06](https://github.com/UW-Macrostrat/web-components/commit/fa23ec06a42fefa638f1b95bdb68473f2fc9615b)
- Updated dependencies
  [fa23ec06](https://github.com/UW-Macrostrat/web-components/commit/fa23ec06a42fefa638f1b95bdb68473f2fc9615b)
  - @macrostrat/column-components@2.0.5
  - @macrostrat/data-components@1.1.4
  - @macrostrat/map-interface@2.2.2
  - @macrostrat/ui-components@5.0.6
  - @macrostrat/mapbox-react@3.1.2
  - @macrostrat/map-styles@2.1.1

All notable changes to this project will be documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.3.1] - 2026-03-31

- Remove a stray `console.log`
- Improve GBDB integration stories

## [3.3.0] - 2026-02-13

- Greatly streamline handling of `InsetMap`, column and unit overlay layers
- Improve design of age range tags

## [3.2.2] - 2026-02-09

- Move `AgeField` and `AgeRange` to separate exports
- Improve handling of interval ranges

## [3.2.1] - 2026-02-08

- Export `ThicknessField` for unit details panels

## [3.2.0] - 2026-02-06

- Update Mapbox dependency to v3
- Add a `MacrostratUnitsOverlay` component for rendering units on
  Mapbox/Maplibre maps, with optional patterns.

## [3.1.0] - 2026-01-31

- Moved `MacrostratDataProvider` and data fetchers to
  `@macrostrat/data-provider` for better modularity.
- Standardize approach to clickable/linkable data items in `UnitDetailsPanel`,
  using a new `MacrostratInteractionProvider` from
  `@macrostrat/data-components`.

## [3.0.3] - 2026-01-29

- Change layout of `package.json`

## [3.0.2] - 2026-01-28

Add rollup interop to fix CommonJS dependency linking issues

## [3.0.1] - 2026-01-28

- Fix CommonJS dependency linking issues

## [3.0.0] - 2026-01-26

- Update peer dependencies to React 18
- Update bundling process to `@macrostrat/web-components-bundler`

## [2.4.4] - 2026-01-25

Add link to SGP facet

## [2.4.3] - 2026-01-06

- Fix error with unit notes for height-based columns

## [2.4.2] - 2025-12-19

Update minimum versions of dependencies

## [2.4.1] - 2025-12-18

- Improve unit selection
- Improve unit popover
- Better unit navigation for correlation diagram
- Show column name in unit popover

## [2.4.0] - 2025-12-15

- Remove `UnitSelectionProvider` in favor of `jotai` state management
- Refactor selected unit state management to use `jotai` atoms
- Improve performance of unit selection and rendering
- Update dependencies

## [2.3.3] - 2025-12-14

Upgraded `jotai` and `jotai-scope` dependencies

## [2.3.2] - 2025-12-13

Remove duplicate exports; fix typings

## [2.3.1] - 2025-12-10

Fix detrital zircon facet rendering bug

## [2.3.0] - 2025-12-10

- Streamline column facet components
- Create a mode for facets that allows focusing a single column-associated
  measurement
- Improve scale calculations in some edge cases
- Condense notes that are close together
- Add explicitly defined height where available from PBDB (eODP columns, mostly)
- Fixed axis label spacing
- Small bug fixes for unit selection

## [2.2.2] - 2025-12-04

- Fix a bug with unit deselection
- Fix missed updates in state management code
- Add a 'minimal' option to `unconformityLabels`
- Reduce precision of gap age labels
- Improvements to stories

## [2.2.1] - 2025-11-29

- Start unifying state management components
- Create a hoistable store for column state
- Begin using `jotai` for some aspects of state management

## [2.2.0] - 2025-11-28

- Update SGP and PBDB facets
- Improve `UnitDetailsPanel` styling and information content
- Improve use of discontinous scales
- Create `hybridScale` options block to allow more dynamic scale generation

## [2.1.4] - 2025-10-29

- Improve stories
- Add SGP facet

## [2.1.3] - 2025-08-22

- Added `UnitDetailsPanelWithNavigation` component
- Added `ColumnBasicInfo` component
- Improve styling of `UnitDetailsPanel`
- Add `ReferencesField` component for bibliographic info
- Add data fetchers for stratigraphic names

## [2.1.2] - 2025-06-26

- UnitDetailsPanel strat name and interval now clickable

## [2.1.1] - 2025-06-26

- Remove local reference

## [2.1.0] - 2025-06-25

- `UnitDetailsContent` allows setting item click or href for Environments,
  Lithologies, and Intervals.
- Add mouseover handlers to allow age cursor to be reported
- Add an `AgeCursor` component
- Reactivate carbon isotopes, detrital zircon, and PBDB integrations
- Make unit selection entirely optional
- Improve styling across the board
- Fix rendering bugs for sections with overlapping units

## [2.0.1] - 2025-05-08

Solve a problem with strict mode

## [2.0.0] - 2025-04-09

Major update for columns and correlation diagrams:

- Add Mapbox-based column selection and correlation-line selection maps
- Add `ColoredUnitComponent` based on mixing unit colors by lithology
- Fully integrated management of composite column scales, allowing for much more
  flexible column creation
- Added zigzag cutoffs when units overflow the time bounds of the column
- Added a unified `MacrostratDataProvider` that allows frontend caching of data
  dictionaries in the UI
- Major improvements to columns and styling

This release will support rendering of stratigraphic columns in Rockd and
Macrostrat.

## [1.0.3] - 2025-03-08

Export `UnitDetailsPanel`

## [1.0.2] - 2025-02-16

Improve column styles

## [1.0.1] - 2025-02-15

Add a `node` target to bundle without imported CSS

## [1.0.0] - 2025-02-14

- First full release of the `@macrostrat/column-views` library
- Centralize column rendering components
- Create storybook examples
- Improve Typescript coverage
- Start process of simplifying React components
- Switch to `zustand` for some state management
