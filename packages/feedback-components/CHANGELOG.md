# Changelog

## [2.0.3] - 2026-04-05 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/feedback-components-v2.0.2...@macrostrat/feedback-components-v2.0.3)

### Patch Changes

- Updated `@macrostrat/hyper` dependency
  [6e9a6654](https://github.com/UW-Macrostrat/web-components/commit/6e9a665456460b31c30316a2a13d41abed94c43a)
- Updated dependencies
  [4bd24d9f](https://github.com/UW-Macrostrat/web-components/commit/4bd24d9f65dacfdbbede3613921182858ec1e3d1)
- Updated dependencies
  [6e9a6654](https://github.com/UW-Macrostrat/web-components/commit/6e9a665456460b31c30316a2a13d41abed94c43a)
  - @macrostrat/data-sheet@3.0.4
  - @macrostrat/data-components@1.1.5
  - @macrostrat/ui-components@5.0.7

## [2.0.2] - 2026-04-04 [_changes_](https://github.com/UW-Macrostrat/web-components/compare/@macrostrat/feedback-components-v2.0.1...@macrostrat/feedback-components-v2.0.2)

### Patch Changes

- Updated [BlueprintJS](https://blueprintjs.com) dependencies to latest `6.x.x`
  series
  [fa23ec06](https://github.com/UW-Macrostrat/web-components/commit/fa23ec06a42fefa638f1b95bdb68473f2fc9615b)
- Updated dependencies
  [fa23ec06](https://github.com/UW-Macrostrat/web-components/commit/fa23ec06a42fefa638f1b95bdb68473f2fc9615b)
  - @macrostrat/data-components@1.1.4
  - @macrostrat/ui-components@5.0.6
  - @macrostrat/data-sheet@3.0.3

All notable changes to this project will be documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.1] - 2026-01-29

- Change layout of `package.json`

## [2.0.0] - 2026-01-26

- Update peer dependencies to React 18
- Update bundling process to `@macrostrat/web-components-bundler`
- Import of `@macrostrat/feedback-components/styles.css` is now required.

## [1.1.10] - 2025-11-28

- Upgrade `parcel` bundler

## [1.1.9] - 2025-08-13

- Allow no model (user feedback)

## [1.1.8] - 2025-07-30

- On load, have any nodes matching autoselect input automically selected
- View only bugs fixed

## [1.1.7] - 2025-07-25

- Can't select tree in view only mode
- View matches on hover in view only mode

## [1.1.6] - 2025-07-24

- Fix view and match glitches

## [1.1.5] - 2025-07-24

- Simplified match logic
- Added view only mode

## [1.1.4] - 2025-07-16

- Add and remove match feature added
- Match now featured on sidebox

## [1.1.3] - 2025-07-16

- Graph node clicking logic same as graph and tree
- "Show matches" switch to displayed matchs on tag hover

## [1.1.2] - 2025-07-10

- Increased the default line spacing in the paragraph text (made it configurable
  via a CSS variable)
- Added a toggle in the graph view to show labels for all nodes, and made nodes
  slightly bigger
- Unified selection interactions
- Updated tags in the "select list" on the right to have styling for
  selected/unselected states consistent with the rest of the interface
- Added "assistant panel" style entity types selector
- Added a border to selected tags in the paragraph area, similar to the list
  view
- Snapped tag selections to word boundaries

## [1.1.1] - 2025-07-01

- new text component, following same clicking rules as tree
- Entity panel updates
- Entity types are editable, deletable, and addable

## [1.1.0] - 2025-06-25

Major updates by David Sklar to improve usability

## [1.0.1] - 2025-02-15

Added a `node` target to bundle without imported CSS.

## [1.0.0] - 2025-02-14

First public release of the `@macrostrat/feedback-components` library, focused
on text feedback for Macrostrat unit information.
