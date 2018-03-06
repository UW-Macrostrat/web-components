SELECT
  l.id,
  l.facies,
  f.color facies_color,
  l.lithology,
  l.covered,
  l.flooding_surface_order,
  coalesce(definite_boundary, true) definite_boundary,
  coalesce(v.pattern, l.lithology) pattern,
  coalesce(l.schematic, false) schematic,
  fgdc_pattern::text,
  l.bottom::float,
  coalesce(
    lead(l.bottom) OVER (ORDER BY l.bottom),
    s.end
  )::float top,
  t.tree,
  l.grainsize,
  coalesce(
    coalesce(l.fill_pattern, v.pattern),
    l.lithology
  ) fill_pattern
FROM section.section_lithology l
LEFT JOIN section.lithology_tree t
  ON l.lithology = t.id
LEFT JOIN section.facies f
  ON l.facies = f.id
LEFT JOIN section.lithology v
  ON l.lithology = v.id
JOIN section.section s
  ON s.id = l.section
WHERE section = $1::text
ORDER BY bottom

