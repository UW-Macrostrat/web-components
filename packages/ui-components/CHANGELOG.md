# Changelog

## [unreleased] - 2025-07-10
For PostgRESTInfiniteScrollView

- Multiselect disapears if only one searchColumn is inputted

## [4.4.0] - 2025-07-10

For PostgRESTInfiniteScrollView

- Custom multiselect labels

## [4.3.8] - 2025-07-09

For PostgRESTInfiniteScrollView

- Error handling for newKey
- Allow inputted searchColumns

## [4.3.7] - 2025-07-09

For PostgRESTInfiniteScrollView

- Even better state management
- Handle adding toggles to header

## [4.3.6] - 2025-07-09

For PostgRESTInfiniteScrollView

- Handle extra params and intitial items
- Better state management

## [4.3.5] - 2025-07-09

For PostgRESTInfiniteScrollView

- Fix import issue

## [4.3.4] - 2025-07-09

For PostgRESTInfiniteScrollView

- Fix export issue

## [4.3.3] - 2025-07-03

- PostgRESTInfiniteScrollView created handling filters and order

## [4.3.2] - 2025-07-03

- Fixed infinite loading issue on mount

## [4.3.1] - 2025-07-02

- Updated infinite scorlling to take `delay` as input param (default 100ms)
- Fixed duplicate data issue in Strict Mode

## [4.3.0] - 2025-06-25

Updated infinite scrolling

- LoadMoreTrigger that changes startingID, allowing for keyset pagination on
  next page
- Added InfiniteScrollContainer that allows for an infinite scrolling list using
  the LoadMoreTrigger, can be filterable

Fixed a bug in UI box model calculations

## [4.2.0] - 2025-04-09

- Updated `zustand` dependency
- Updated "dev tools" manager
- Improved typings for padding and margin management utilities
- Internal reorganization of hook functions
- Added `addQueryString` and `joinURL` query management utilities
- Added `useAsyncMemo` hook for cached async values

## [4.1.3] - 2025-02-20

- Improved styling for numeric sliders when disabled
- TODO: move numeric slider to `@macrostrat/form-components`

## [4.1.2] - 2025-02-16

Add body classes `light-mode` and `bp5-light` to `DarkModeProvider` when it is
explicitly disabled.

## [4.1.1] - 2025-02-15

- Add a `node` target to bundle without imported CSS. This is a stopgap measure
  until we can figure out how to handle CSS imports in a more general way.
- Move from `typescript` to `source` export in `package.json`

## [4.1.0] - 2025-02-14

- New compilation pipeline
- New storybook examples
- Improved Typescript coverage
- Added `SizeAwareLabel` component (originally from `@macrostrat/timescale`)
- Improved flexbox styling

## [4.0.7] - 2024-10-24

## [4.0.6] - 2024-10-24

## [4.0.5] - 2024-10-24

## [4.0.4] - 2024-10-24

Fix bad build instructions

## [4.0.3] - 2024-10-24

- Fix package specifiers
- Upgrade `@macrostrat/hyper` to version 3
- Upgrade `query-string` to version 9

## [4.0.2] - 2024-10-24

- Migrate from `@blueprintjs/datetime` to `@blueprintjs/datetime2` to allow
  official React 18 compatibility
- Allow `@macrostrat/hyper` version 3
- Update `query-string` to version 9
- Remove unused dependencies, which were mostly present due to speculation on
  future needs and desired functionality
  - `@mantine/core`
  - `@mantine/hooks`
  - `io-ts`
  - `fp-ts`
  - `core-js`
  - `date-fns`
  - `@emotion/react`
  - `@babel/polyfill`
- Create a "development panel" component for use in application debugging
- Remove `init.js` file, which was used to set up global state but is kind of
  outmoded.

## [4.0.1] - 2024-10-02

Bug fix: missing package specifier

## [4.0.0] - 2024-10-02

- Update BlueprintJS to version 5
- Remove unused script files
- Add an `applySystemDarkMode` function to `DarkModeProvider` to allow the user
  to apply the system's dark mode setting.
- Add a default validator for local storage items to prevent errors arising from
  malformed stored objects.
- Broke out position button handling somewhat
- Removed duplicate styles

## [3.2.2] - Unknown date

## [3.2.0] - Unknown date

## [3.1.0] - 2023-04-21

- Add a `followSystem` option to `DarkModeProvider` to allow the user to follow
  the system's dark mode setting.
- Add a `Box`, `FlexRow`, `FlexColumn`, and `Spacer` components to improve
  layout capabilities.

## [3.0.0] - August 2022

- Modernize compilation toolchain to use Parcel

## [2.0.0] - June 2022

- Switch to Sass for stylesheets
- Integrate with monorepo

## [1.0.4] - 12-01-2022

- Add box model helpers (for plotting) to this library.

## [1.0.0] - 23-09-2021

- Finally remove deprecated `APIView` component.
- Change `InfiniteScrollView` component to use `IntersectionObserver` APIs, in
  order to get rid of stale dependency `react-infinite-scroller`.
- Add a `useScrollMarkers` hook

## [0.7.0] - 20-09-2021

- **Breaking change**: Move `LinkCard` and other compents in `ext/router-links`
  to the new
  [ `@macrostrat/router-components`](https://github.com/UW-Macrostrat/router-components)
  module.
- Add a skeletal data provider that tracks multiple `useAPIResult` calls
- Added a default theme (Monokai) to `JSONView`
- Added a `ModalPanel` component
- Upgrade `@macrostrat/hyper` dependency

## [0.6.0] - 28-06-2021

- **Breaking change**: Move `LinkCard` and other components depending on
  `react-router-dom` to a separate `ext/router-links` section. This allows
  applications that don't use `react-router` to still use the bulk of the module
- Move Changelog to a separate file
- Upgrade delete button
- Added an `ErrorBoundary` component
- Allowed resetting `useStoredState` using a third parameter, as such:
  `const [state, setState, resetState] = useStoredState(id, initialState)`
- Can now reset dark mode state to default using a `Shift+click` on the
  `DarkModeButton`.

## [0.5.0] - 10-02-2021

- Move towards using Axios base types for API context. Allows more advanced
  abilities to control global request context through Axios's built-in methods.
  Additional configurability will be progressively added through the `0.5`
  series.

## [0.4.4] - 14-11-2020

- Small fixes to query string management
- Added ability for dark mode provider to set body classes. This can prevent
  blinding flashes in certain situations.

## [0.4.2] - 12-10-2020

- Added `SettingsProvider` and settings context for persistent settings
- Upgraded dark mode context to store values across page reloads (using local
  storage)

## [0.3.0] - 18-08-2020

- Merge query string management.
- Update to bundling strategy.
- Remove all typing errors
