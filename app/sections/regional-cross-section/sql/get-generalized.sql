WITH a AS (
SELECT
  (ST_Dump(ST_Node(ST_SnapToGrid(
    ST_GeomFromGeoJSON(${geometry:json}),
    0.1
  )))).geom
)
SELECT
  'feature' AS type,
  ST_AsGeoJSON(ST_Simplify((ST_Dump(
      ST_Polygonize(geom)
  )).geom,0.2))::json AS geometry FROM a
