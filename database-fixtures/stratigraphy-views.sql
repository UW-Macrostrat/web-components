CREATE OR REPLACE VIEW section.section_surface_data AS
SELECT
  l.id,
  l.facies,
  l.section,
  f.color facies_color,
  l.lithology,
  l.covered,
  l.flooding_surface_order,
  l.surface,
  ss.note,
  coalesce(definite_boundary, true) definite_boundary,
  coalesce(v.pattern, l.lithology) pattern,
  coalesce(l.schematic, false) schematic,
  fgdc_pattern::text,
  l.bottom::float,
  coalesce(
    lead(l.bottom) OVER (PARTITION BY l.section ORDER BY l.bottom),
    s.end
  )::float top,
  t.tree,
  l.grainsize,
  l.surface_type_1,
  l.surface_type_2,
  coalesce(
    coalesce(l.fill_pattern, v.pattern),
    l.lithology
  ) fill_pattern
FROM section.section_lithology l
LEFT JOIN section.lithology_tree t
  ON l.lithology = t.id
LEFT JOIN section.surface ss
  ON l.surface = ss.id
LEFT JOIN section.facies f
  ON l.facies = f.id
LEFT JOIN section.lithology v
  ON l.lithology = v.id
JOIN section.section s
  ON s.id = l.section;

CREATE OR REPLACE VIEW section.generalized_section_surface AS
WITH l AS (
SELECT
	l.id,
	b.locality section,
	f.color facies_color,
	l.section original_section,
	l.bottom original_height,
	l.bottom+section.generalized_offset(l.section) bottom,
	l.covered,
	l.lithology,
	l.surface,
  coalesce(definite_boundary, true) definite_boundary,
  coalesce(v.pattern, l.lithology) pattern,
	l.fgdc_pattern::text,
	coalesce(l.schematic, false) schematic,
	l.grainsize,
	l.fill_pattern,
	l.facies
FROM section.section_lithology l
JOIN section.generalized_breaks b
  ON l.section = b.section
LEFT JOIN section.facies f
  ON l.facies = f.id
LEFT JOIN section.lithology v
  ON l.lithology = v.id
WHERE b.lower_height <= l.bottom
  AND l.bottom < b.upper_height
)
SELECT
	l.*,
  coalesce(
    lead(l.bottom) OVER (PARTITION BY l.section ORDER BY l.bottom),
    s.end + section.generalized_offset(l.original_section)
  )::float top,
  t.tree
FROM l
JOIN section.lithology_tree t
  ON l.lithology = t.id
JOIN section.section s
  ON s.id = l.original_section
ORDER BY section, bottom;
