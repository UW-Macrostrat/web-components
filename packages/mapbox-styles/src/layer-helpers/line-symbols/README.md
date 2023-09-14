# Geological line symbols

This is a quick reference for the geological line symbols
that are used (or planned to be used) in Macrostrat maps.
Here, we've compiled them into SVG and PNG symbols for use in Mapbox GL JS, QGIS,
and other web GIS software.

This symbology is a subset of the [FGDC Geologic Map Symbolization Standard](https://ngmdb.usgs.gov/fgdc_gds/geolsymstd/download.php),
and these digital representations are aligned with our indices of [geologic patterns](https://davenquinn.com/projects/geologic-patterns/)
and of [point symbols](../point-features/symbols/README.md).

**These symbols are included in Macrostrat's geologic map on an experimental basis ([example from the Canadian Rockies](https://macrostrat.org/map/#x=-114.5797&y=50.1739&z=9.5&show=line-symbols,geology)).**

Unlike our point symbol index, these line symbols are not indexed by priority — all of these are of high importance. We have not yet attempted
to compile an index of all possible line symbols. Each symbol is overlaid on a line, which for the below examples is horizontal at the centerline of the image.

## Faults

Fault lines are typically shown in black or (less often) red.

| Name                | Symbol                                                                  |
| ------------------- | ----------------------------------------------------------------------- |
| Thrust fault        | <img src="./assets/svg/thrust-fault.svg" width="30" height="30">        |
| Normal fault        | <img src="./assets/svg/normal-fault.svg" width="30" height="30">        |
| Right-lateral fault | <img src="./assets/svg/right-lateral-fault.svg" width="30" height="30"> |
| Left-lateral fault  | <img src="./assets/svg/left-lateral-fault.svg" width="30" height="30">  |
| Reverse fault       | <img src="./assets/svg/reverse-fault.svg" width="30" height="30">       |

All fault symbols are "oriented" (i.e. they appear on one side of the line in a meaningful way).

| Name                | Symbol                                                                  |
| ------------------- | ----------------------------------------------------------------------- |
| Anticline hinge (fold axis)    | <img src="./assets/svg/anticline-hinge.svg" width="30" height="30">     |
| Syncline hinge  (fold axis    | <img src="./assets/svg/syncline-hinge.svg" width="30" height="30">      |

Anticline and syncline hinges are symmetrical symbols, but fold lines are often still directional ("plunging"). These plunges are typically represented as solid triangular arrow

## Line dash patterns

Dashes and dots are commonly used to represent certainty (dashes) and "covered" (dots) lines, alongside the above symbols.
