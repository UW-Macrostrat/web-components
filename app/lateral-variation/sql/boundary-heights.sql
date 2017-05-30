WITH
s AS (
	SELECT * FROM section.inferred_surface i
	JOIN section.section s ON s.id = i.section
	JOIN section.locality l ON l.name = s.location
	ORDER BY l.display_order, s.id
)
SELECT
	lower_unit,
	upper_unit,
	commonality,
	array_agg(section) section,
	array_agg(height) height,
  CASE
    WHEN upper_unit IS NULL THEN 1
    WHEN commonality >= 3 THEN 1
    WHEN commonality < 3 THEN 4
  END AS weight
FROM s
GROUP BY lower_unit, upper_unit, commonality;
