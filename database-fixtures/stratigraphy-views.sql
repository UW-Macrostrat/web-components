CREATE OR REPLACE VIEW section.generalized_breaks AS
WITH upper AS (
SELECT
  locality,
  b.lower_section section,
  l1.surface upper_surface,
  l1.bottom upper_height
FROM section.locality_generalized_breaks b
LEFT JOIN section.section_lithology l1
  ON b.surface = l1.surface
 AND l1.section = b.lower_section
), lower AS (
SELECT
  locality,
  b.upper_section section,
  l1.surface lower_surface,
  coalesce(l1.bottom, null) lower_height
FROM section.locality_generalized_breaks b
LEFT JOIN section.section_lithology l1
  ON b.surface = l1.surface
 AND l1.section = b.upper_section
)
SELECT
	coalesce(lower.locality, upper.locality) locality,
	coalesce(lower.section, upper.section) section,
	lower_surface,
	coalesce(
		lower_height, (
      SELECT start
      FROM section.section s
      WHERE s.id = upper.section
    )
	) lower_height,
	upper_surface,
	coalesce(
		upper_height, (
      SELECT coalesce(s.clip_end,s.end)
      FROM section.section s
      WHERE s.id = lower.section
    )
	) upper_height
FROM lower
FULL JOIN upper
  ON lower.section = upper.section
WHERE (
    upper.section IS NOT null
 OR lower.section IS NOT null
);

/* Recursive function to compute the offset
   of a surface within a generalized column */
CREATE OR REPLACE FUNCTION section.generalized_offset(section_id text)
RETURNS numeric
AS $$
SELECT
  coalesce(section.generalized_offset(b0.section),0)+coalesce(b0.upper_height,0)-b1.lower_height
FROM section.generalized_breaks b0
FULL JOIN section.generalized_breaks b1
  ON b0.upper_surface = b1.lower_surface
 AND b0.locality = b1.locality
WHERE b1.section = section_id
LIMIT 1
$$
LANGUAGE "sql" IMMUTABLE;

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
  l.surface_type,
  l.surface_order,
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
  SELECT * FROM section.section_surface_data
)
SELECT
  l.id,
  l.facies,
  s.location section,
  l.section original_section,
  l.bottom original_bottom,
  l.top original_top,
  l.bottom+section.generalized_offset(l.section) bottom,
  l.top+section.generalized_offset(l.section) top,
  l.facies_color,
  l.lithology,
  l.covered,
  l.flooding_surface_order,
  l.surface,
  l.note,
  l.definite_boundary,
  l.pattern,
  l.schematic,
  l.fgdc_pattern,
  l.tree,
  l.grainsize,
  l.surface_type,
  l.surface_order,
  l.fill_pattern
FROM l
JOIN section.generalized_breaks b
  ON l.section = b.section
JOIN section.section s
  ON s.id = l.section
WHERE b.lower_height <= l.bottom
  AND l.bottom < b.upper_height
ORDER BY s.location, bottom;
