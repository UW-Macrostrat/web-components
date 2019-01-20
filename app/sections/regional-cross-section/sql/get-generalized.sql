WITH a AS (
SELECT
  (ST_Dump(ST_Node(ST_SnapToGrid(
    ST_Simplify(ST_GeomFromGeoJSON(${geometry:json}),0.1),
    0.1
  )))).geom
)
SELECT ST_AsGeoJSON((ST_Dump(
      ST_Polygonize(geom))).geom)::json AS geometry FROM a
