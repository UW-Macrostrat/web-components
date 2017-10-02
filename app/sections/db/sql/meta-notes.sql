SELECT
  start_height,
  end_height,
  coalesce(end_height,start_height) text_height,
  end_height-start_height span,
  coalesce(end_height > start_height, false) has_span,
  note
FROM section.section_note
WHERE type = 'note'
  AND section = $1
ORDER BY start_height
