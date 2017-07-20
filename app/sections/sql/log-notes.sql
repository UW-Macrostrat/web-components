SELECT
  id,
  start_height,
  end_height,
  end_height-start_height span,
  coalesce(end_height > start_height, false) has_span,
  symbol,
  type,
  coalesce(edited_note, note) note
FROM section.section_note
WHERE section = $1
  --AND type = 'log'
  AND coalesce(display_in_log, true)
  AND (
    note IS NOT null OR
    edited_note IS NOT null)
ORDER BY start_height
