WITH l AS (
SELECT
	l.id,
	b.locality section,
	l.section original_section,
	l.bottom original_height,
	l.bottom+section.generalized_offset(l.section) bottom,
	l.covered,
	l.lithology,
	l.surface,
	l.fgdc_pattern,
	l.schematic,
	l.grainsize,
	l.fill_pattern,
	l.facies
FROM section.section_lithology l
JOIN section.generalized_breaks b ON l.section = b.section
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
