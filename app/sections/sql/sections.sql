SELECT
  s.id::text AS section,
  s.start::float,
  s.end::float,
  s.offset,
  s.location
FROM section.section s
JOIN section.locality l ON s.location = l.name
ORDER BY l.display_order, s.id
