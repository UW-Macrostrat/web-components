WITH lithostrat AS (
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
  AND active
  GROUP BY lower_unit, upper_unit
),
sequence_strat AS (
SELECT
  json_agg(json_build_object(
      'section',section::text,
      'height', bottom,
      'inferred', false
  )) section_height,
  min(surface_order) AS surface_order,
  mode() WITHIN GROUP (ORDER BY flooding_surface_order) AS flooding_surface_order,
  surface surface_id
FROM section.section_lithology l
GROUP BY (l.surface)
)
SELECT
  surface_id,
  'sequence-strat' AS type,
  section_height,
  5-coalesce(surface_order, flooding_surface_order) AS flooding_surface_order,
  coalesce(surface_order, abs(flooding_surface_order)) AS commonality,
  s.note,
  s.sequence_boundary,
  null AS lower_unit,
  null AS upper_unit
FROM sequence_strat ss
JOIN section.surface s
  ON ss.surface_id = s.id
UNION ALL
SELECT
  null surface_id,
  'lithostrat',
  section_height,
  null,
  coalesce(
    mapping.unit_commonality(lower_unit,upper_unit),
    0
  ) unit_commonality,
  null,
  false,
  lower_unit,
  upper_unit
FROM lithostrat
