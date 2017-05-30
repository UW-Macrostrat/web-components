WITH a AS (
SELECT
	t1.upper_unit AS unit,
	t1.height AS start,
	t2.height AS end,
	t1.section
FROM section.inferred_surface t1
JOIN section.inferred_surface t2
  ON t1.section = t2.section
  AND t1.upper_unit = t2.lower_unit
JOIN section.section s ON t1.section = s.id
JOIN section.locality l ON s.location = l.name
ORDER BY l.display_order, t1.section
),
b AS (
SELECT
	unit,
  array_agg(a.section) AS section,
	array_agg(a.start) AS start,
	array_agg(a.end) AS end
FROM a
GROUP BY unit
)
SELECT
	b.*,
	u.color,
  u.dominant_lithology
FROM b
JOIN mapping.unit u ON u.id = unit;
