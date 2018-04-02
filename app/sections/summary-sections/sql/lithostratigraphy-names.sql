WITH a AS (
SELECT
  id,
  name,
  level,
  coalesce(u.short_name, name) short_name
FROM mapping.unit u
WHERE id = ANY(mapping.subunits('zebra-nappe'))
)
SELECT
  a.id::text,
  a.name::text,
  a.level,
  a.short_name::text,
  null AS formation_id,
  null AS formation_name,
  null AS formation_short_name
FROM a
WHERE level = 3
UNION
SELECT
  a.id::text,
  a.name::text,
  a.level,
  a.short_name::text,
  a1.id::text,
  a1.name::text,
  a1.short_name::text
FROM a
JOIN a a1
  ON a.id = ANY(mapping.subunits(a1.id))
 AND a1.level = 3
WHERE a.level = 4
