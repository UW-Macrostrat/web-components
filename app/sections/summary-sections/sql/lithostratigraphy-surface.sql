WITH a AS (
SELECT
  json_agg(json_build_object(
      'section',section,
      'height', height,
      'inferred', inferred
  )) section_height,
  lower_unit,
  upper_unit
FROM section.section_surface
WHERE lower_unit IS NOT null
  AND upper_unit IS NOT null
  GROUP BY lower_unit, upper_unit
)
SELECT
  *,
  coalesce(
    mapping.unit_commonality(lower_unit,upper_unit),
    0
  ) unit_commonality
FROM a
