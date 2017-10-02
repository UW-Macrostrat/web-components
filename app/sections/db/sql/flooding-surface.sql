SELECT
  id,
  bottom AS height,
  flooding_surface_order
FROM section.section_lithology
WHERE flooding_surface_order IS NOT null
  AND section=$1
ORDER BY bottom
