# Changelog

## [4.0.0] - 2024-10-02

- Update BlueprintJS to version 5
- Remove unused script files
- Add an `applySystemDarkMode` function to `DarkModeProvider` to allow the user to apply the system's dark mode setting.
- Add a default validator for local storage items to prevent errors arising
  from malformed stored objects.
- Broke out position button handling somewhat
- Removed duplicate styles

## [3.2.2] - Unknown date

## [3.2.0] - Unknown date

## [3.1.0] - 2023-04-21

- Add a `followSystem` option to `DarkModeProvider` to allow the user to follow the system's dark mode setting.
- Add a `Box`, `FlexRow`, `FlexColumn`, and `Spacer` components
  to improve layout capabilities.

## [3.0.0] - August 2022

- Modernize compilation toolchain to use Parcel

## [2.0.0] - June 2022

- Switch to Sass for stylesheets
- Integrate with monorepo

## [1.0.4] - 12-01-2022

- Add box model helpers (for plotting) to this library.

## [1.0.0] - 23-09-2021

- Finally remove deprecated `APIView` component.
- Change `InfiniteScrollView` component to use `IntersectionObserver` APIs, in order to get rid of stale dependency `react-infinite-scroller`.
- Add a `useScrollMarkers` hook

## [0.7.0] - 20-09-2021

- **Breaking change**: Move `LinkCard` and other compents in `ext/router-links` to the new [`@macrostrat/router-components`](https://github.com/UW-Macrostrat/router-components) module.
- Add a skeletal data provider that tracks multiple `useAPIResult` calls
- Added a default theme (Monokai) to `JSONView`
- Added a `ModalPanel` component
- Upgrade `@macrostrat/hyper` dependency

## [0.6.0] - 28-06-2021

- **Breaking change**: Move `LinkCard` and other components depending on `react-router-dom` to a separate `ext/router-links` section.
  This allows applications that don't use `react-router` to still use the bulk of the module
- Move Changelog to a separate file
- Upgrade delete button
- Added an `ErrorBoundary` component
- Allowed resetting `useStoredState` using a third parameter, as such: `const [state, setState, resetState] = useStoredState(id, initialState)`
- Can now reset dark mode state to default using a `Shift+click` on the `DarkModeButton`.

## [0.5.0] - 10-02-2021

- Move towards using Axios base types for API context. Allows more advanced abilities
  to control global request context through Axios's built-in methods. Additional configurability
  will be progressively added through the `0.5` series.

## [0.4.4] - 14-11-2020

- Small fixes to query string management
- Added ability for dark mode provider to set body classes. This can prevent
  blinding flashes in certain situations.

## [0.4.2] - 12-10-2020

- Added `SettingsProvider` and settings context for persistent settings
- Upgraded dark mode context to store values across page reloads (using local storage)

## [0.3.0] - 18-08-2020

- Merge query string management.
- Update to bundling strategy.
- Remove all typing errors
