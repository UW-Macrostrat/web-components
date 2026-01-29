# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2026-01-29

- Change layout of `package.json` and explicitly mark no side effects.

## [1.2.0] - 2026-01-27

Change build system from Parcel to Vite

## [1.1.2] - 2025-11-28

Updated Parcel bundler

## [1.1.1] - 2025-06-25

Add `delta` parameter to `getLuminanceAdjustedColorScheme` to control the
strength of the luminance adjustment.

## [1.1.0] - 2025-04-09

- Add `getLuminanceAdjustedColorScheme` to get a set of colors with adjusted
  luminance for a given base and light and dark themes, including the following
  colors:
  `{mainColor, backgroundColor, secondaryColor, secondaryBackgroundColor}`.
- Add `getCSSVariable` and `asCSSVariables` functions

## [1.0.1] - 2025-02-14

- Fix packaging issues
- Update typings

## [1.0.0] - 2024-10-26

- First public release of the `@macrostrat/color-utils` library
- Added `asChromaColor`, `getColorPair`, and `toRGBAString` functions
