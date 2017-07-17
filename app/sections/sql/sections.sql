SELECT
  s.id AS section,
  s.start,
  s.end,
  coalesce(s.offset,0) AS offset,
  s.location
FROM section.section s
JOIN section.locality l ON s.location = l.name
ORDER BY l.display_order, s.id
