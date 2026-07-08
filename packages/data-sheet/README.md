# Data sheet

A new data sheet component for Macrostrat based on the BlueprintJS table
component. This will eventually replace the existing data sheet component.

## PostgREST table

A goal of this module is to create a generic table that can be bootstrapped on
top of PostgreSQL routes, with support for filtering, sorting, and pagination.
This will be supported by the [PostgREST](https://postgrest.org/) API, which
provides generic API tooling over PostgreSQL tables and views.

The design of this conceptually follows the
[Supabase Grid](https://github.com/supabase/grid) component, which has been
deprecated as a standalone module. The current version of the Supabase Grid is
available in the
[Supabase Studio app](https://github.com/supabase/supabase/tree/master/apps/studio/components/grid),
but is in my opinion a bit tightly coupled to the Supabase ecosystem now. Still,
it can be used, at minimum, as a design reference.

## Changes from Data Sheet v1

- The new data sheet will be based on BlueprintJS, a more mature and
  feature-rich table component library.
- In particular, the BlueprintJS table natively supports virtualization, which
  is important for performance when rendering large tables.

## Evolution roadmap (v4)

Ongoing work to generalize capabilities that consumers (notably the Macrostrat
map-ingestion tables) have had to hand-roll. The guiding architecture is **two
orthogonal APIs**: the **column spec** is the primary, atomic, backend-agnostic
description of table _behavior_ (render / edit / validate + capability flags),
and the **data source** is how rows flow in (`data` and/or a fetch function).
Every change is additive and opt-in, ships with a Storybook example, and is
recorded in the `CHANGELOG`. See the design doc in the Workbench
(`Feature areas/Data sheet library evolution.md`) for full rationale.

Workstreams, in sequence:

- [x] **G — Bugfixes** (small, low-risk, land first)
  - [x] `onCellEdited` empty↔null normalization (no phantom edit when an
        empty cell stays empty) — _story:_ `Data sheet/Editing`
  - [x] Filter-aware edit methods (`clearSelection` / `onSelectionEdited` /
        `fillValues` target the correct data row under sort/filter) —
        _story:_ `Data sheet/Editing`, `Data sheet/Filters`
  - [x] `col.style` clone (stop mutating the caller's style object)
  - [x] Remove dead `onSaveData` prop (never invoked; save is a table action)
- [x] **B — Rich cell-render context** (pass `{ rowIndex, colIndex, column,
      row, isEdited, isDeleted }` to renderers)
- [x] **C — Cell interaction & editor UX** (`cellInteraction` auto/manual;
      per-cell editor selection; focus flow-through with Escape→nav-mode,
      direction-of-travel cursor, Enter/F2 to edit, click-to-toggle;
      read-only `detailRenderer` panels)
- [x] **A — Controlled editing** (`onEdit(event)` + controlled
      `updatedData` / `rowStatus` overlay; unified `cellDetail` /
      `detailPresentation` surface API)
- [ ] **D+E — Data source & view state** (unified
      `fetchChunk({ offset, limit, sorts, filters, group, signal })` +
      column-declared sort / filter / group / hide; scroll-to-row gated on
      source length/addressing traits)
- [ ] **F — Row-header customization** (group-key labels, omit styling)
