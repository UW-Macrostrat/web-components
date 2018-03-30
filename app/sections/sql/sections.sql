SELECT
  s.id::text AS section,
  s.start::float,
  s.end::float,
  coalesce(s.clip_end,s.end)::float clip_end,
  s.offset,
  s.location
FROM section.section s
JOIN section.locality l ON s.location = l.name
ORDER BY l.display_order, s.id
