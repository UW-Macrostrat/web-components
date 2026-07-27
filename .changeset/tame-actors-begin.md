---
"@macrostrat/map-interface": minor
"@macrostrat/mapbox-react": minor
"@macrostrat/mapbox-utils": minor
---

- Improve batching of map easing updates to reduce UI jank
- Streamline the calculation of padding for map context and detail panels
- Add a new `--map-context-stack-padding` CSS variable to control whether the map's internal
  padding responds to the width of the map context panel. This is useful for cases
  when the context panel is expected to take up minimum vertical space and should not be
  considered to cover the map
- Added a new `near-edge` position value to allow markers to be centered only when clicked near the edge
- New Storybook stories for map context and detail panels
