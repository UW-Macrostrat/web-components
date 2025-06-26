# Changelog

All notable changes to this project will be documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [unreleased] - 2025-06-26

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
- Added the ability to have zig-zag cutoffs when units overflow the time bounds
  of the column
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
