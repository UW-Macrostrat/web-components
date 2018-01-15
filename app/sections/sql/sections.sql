SELECT
  s.id::text AS section,
  s.start::float,
  s.end::float,
  coalesce(
    coalesce(s.offset_compact,s.offset),
    0
  )::float AS offset,
  s.location
FROM section.section s
JOIN section.locality l ON s.location = l.name
ORDER BY l.display_order, s.id
