# Changelog

## `[0.6.0]` - 28-06-2021

- **Breaking change**: Move `LinkCard` and other components depending on `react-router-dom` to a separate `ext/router-links` section.
  This allows applications that don't use `react-router` to still use the bulk of the module
- Move Changelog to a separate file
- Upgrade delete button
- Added an `ErrorBoundary` component
- Allowed resetting `useStoredState` using a third parameter, as such: `const [state, setState, resetState] = useStoredState(id, initialState)`
- Can now reset dark mode state to default using a `Shift+click` on the `DarkModeButton`.

## `[0.5.0]` - 10-02-2021

- Move towards using Axios base types for API context. Allows more advanced abilities
  to control global request context through Axios's built-in methods. Additional configurability
  will be progressively added through the `0.5` series.

## `[0.4.4]` - 14-11-2020

- Small fixes to query string management
- Added ability for dark mode provider to set body classes. This can prevent
  blinding flashes in certain situations.

## `[0.4.2]` - 12-10-2020

- Added `SettingsProvider` and settings context for persistent settings
- Upgraded dark mode context to store values across page reloads (using local storage)

## `[0.3.0]` - 18-08-2020

- Merge query string management.
- Update to bundling strategy.
- Remove all typing errors
