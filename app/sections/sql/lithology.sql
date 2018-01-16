SELECT
  l.lithology,
  l.covered,
  coalesce(definite_boundary, true) definite_boundary,
  coalesce(v.pattern, l.lithology) pattern,
  coalesce(l.schematic, false) schematic,
  fgdc_pattern,
  l.bottom::float,
  coalesce(
    lead(l.bottom) OVER (ORDER BY l.bottom),
    s.end
  )::float top,
  t.tree
FROM section.section_lithology l
JOIN section.lithology_tree t
  ON l.lithology = t.id
JOIN section.lithology v
  ON l.lithology = v.id
JOIN section.section s
  ON s.id = l.section
WHERE section = $1::text
  AND l.lithology IS NOT null
ORDER BY bottom
