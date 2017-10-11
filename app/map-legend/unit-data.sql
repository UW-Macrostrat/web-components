WITH uA AS (
	SELECT DISTINCT ON (unit_id)
		UNNEST(t.tree) unit_id
	FROM
		mapping.map_face f
		JOIN mapping.unit_tree t ON f.unit_id = t.id
		WHERE unit_id IS NOT NULL AND unit_id != 'unknown')
SELECT
	unit_id,
	coalesce(u.member_of,'root') member_of,
	u.color,
	u.level,
  l.name AS type,
	t.tree,
  coalesce(u.order,0) AS order,
  coalesce(u.short_desc,u.desc) AS desc,
  coalesce(u.short_name,u.name) AS name
FROM uA
JOIN mapping.unit_tree t ON uA.unit_id = t.id
JOIN mapping.unit u ON u.id = uA.unit_id
LEFT JOIN mapping.unit_level l ON u.level = l.id;
