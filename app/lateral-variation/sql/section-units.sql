-- Gets an ordered list of units per section

WITH RECURSIVE t AS (
	SELECT
		s.section,
		upper_unit AS next_unit,
		ARRAY[lower_unit, upper_unit] AS units
	FROM section.section_surface s
	WHERE lower_unit NOT IN (SELECT DISTINCT upper_unit FROM section.section_surface sa WHERE s.section = sa.section)
	UNION ALL
	SELECT
		s1.section,
		s1.upper_unit AS next_unit,
		t.units || ARRAY[s1.upper_unit]
	FROM t JOIN section.section_surface s1
	ON t.next_unit = s1.lower_unit
	AND t.section = s1.section)
SELECT section, units FROM t
WHERE next_unit NOT IN (SELECT DISTINCT lower_unit FROM section.section_surface sb WHERE t.section = sb.section);
