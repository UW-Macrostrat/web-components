SELECT
  start_height,
  end_height,
  coalesce(end_height,start_height) text_height,
  end_height-start_height span,
  coalesce(end_height > start_height, false) has_span,
  symbol,
  type,
  note
FROM section.section_note
WHERE section = $1
--  AND type = 'log'
ORDER BY start_height
