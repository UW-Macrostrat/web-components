WITH photo_notes AS (
  SELECT
    note_id,
    array_agg(photo_id) AS photos
  FROM photo_note
  GROUP BY note_id
)
SELECT
  id,
  start_height::float,
  end_height::float,
  (end_height-start_height)::float span,
  coalesce(end_height > start_height, false) has_span,
  symbol,
  type,
  coalesce(edited_note, note) note,
  photos
FROM section.section_note n
LEFT JOIN photo_notes ON n.id = note_id
WHERE section = $1
  AND coalesce(display_in_log, true)
  AND (
    note IS NOT null OR
    edited_note IS NOT null)
ORDER BY start_height
