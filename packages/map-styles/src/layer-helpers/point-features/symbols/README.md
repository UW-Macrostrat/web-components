# Geological point symbols

This is a quick reference for the geological point symbols that are used (or
planned to be used) in Macrostrat maps. Here, we've compiled these into PNG
symbols for use in Mapbox GL JS, QGIS, and other web GIS software. This data
comes from the
[FGDC Geologic Map Symbolization Standard](https://ngmdb.usgs.gov/fgdc_gds/geolsymstd/download.php),
and many of the symbols were digitized by the
[StraboSpot](https://strabospot.org/) team.

The attempt to compile an index is analogous to our indices of
[geologic patterns](https://davenquinn.com/projects/geologic-patterns/) and of
[line symbols](../../line-symbols/README.md).

## Most common

These are the most common symbols on maps. They represent oriented features,
rotated by the feature's azimuth. They would typically be accompanied by a
number representing the dip of the feature.

| Name      | Symbol                                                        | Priority |
| --------- | ------------------------------------------------------------- | -------- |
| Bedding   | <img src="./bedding_inclined.png" width="100" height="100">   |
| Foliation | <img src="./foliation_inclined.png" width="100" height="100"> |
| Lineation | <img src="./lineation_general.png" width="100" height="100">  |

#### Special cases

These special cases represent horizontal and vertical instances of the features
above. These features are relatively less common in maps. These would typically
not be accompanied with a number to represent the dip, as that information is
already encoded in the symbol.

| Name                     | Symbol                                                          | Priority |
| ------------------------ | --------------------------------------------------------------- | -------- |
| Bedding (horizontal)\*   | <img src="./bedding_horizontal.png" width="100" height="100">   |
| Bedding (vertical)       | <img src="./bedding_vertical.png" width="100" height="100">     |
| Foliation (vertical)     | <img src="./foliation_vertical.png" width="100" height="100">   |
| Foliation (horizontal)\* | <img src="./foliation_horizontal.png" width="100" height="100"> |

\*Not oriented

## Common symbols

| Name                        | Symbol                                                                     | Priority |
| --------------------------- | -------------------------------------------------------------------------- | -------- |
| Cleavage                    | <img src="./unused/cleavage_inclined.png" width="100" height="100">        |
| Joint surface               | <img src="./unused/joint_surface_inclined_1.png" width="100" height="100"> |
| Fault surface               | <img src="./unused/fault_surface_inclined.png" width="100" height="100">   |
| Fault (with slip direction) | <img src="./fault.png" width="100" height="100">                           |
| Fold axis                   | <img src="./unused/fold_axis.png" width="100" height="100">                |
| Sample locality\*           | <img src="./unused/sample_locality.png" width="100" height="100">          |

\*Not oriented

#### Special cases

| Name                     | Symbol                                                                   | Priority |
| ------------------------ | ------------------------------------------------------------------------ | -------- |
| Cleavage (vertical)      | <img src="./unused/cleavage_vertical.png" width="100" height="100">      |
| Joint surface (vertical) | <img src="./unused/joint_surface_vertical.png" width="100" height="100"> |
| Fault surface (vertical) | <img src="./unused/fault_surface_vertical.png" width="100" height="100"> |

## Less common symbols

| Name            | Symbol                                                            | Priority |
| --------------- | ----------------------------------------------------------------- | -------- |
| Shear zone      | <img src="./shear_zone_inclined.png" width="100" height="100">    |
| Contact         | <img src="./contact_inclined.png" width="100" height="100">       |
| Fracture        | <img src="./fracture.png" width="100" height="100">               |
| Fault striation | <img src="./unused/fault_striation.png" width="100" height="100"> |
| Flow            | <img src="./unused/flow.png" width="100" height="100">            |
| Intersection    | <img src="./unused/intersection.png" width="100" height="100">    |
| Striation       | <img src="./unused/striation.png" height="50">                    |
| Solid state     | <img src="./unused/solid_state.png" width="100" height="100">     |
| Shear fracture  | <img src="./unused/shear_fracture.png" width="100" height="100">  |
| Vector          | <img src="./unused/vector.png" width="100" height="100">          |

#### Special cases

| Name                  | Symbol                                                         | Priority |
| --------------------- | -------------------------------------------------------------- | -------- |
| Contact (vertical)    | <img src="./contact_vertical.png" width="100" height="100">    |
| Shear zone (vertical) | <img src="./shear_zone_vertical.png" width="100" height="100"> |
