# Changelog

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
