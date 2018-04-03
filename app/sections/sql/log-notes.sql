WITH __photo_notes AS (
  SELECT
    note_id,
    array_agg(photo_id) AS photos
  FROM section.section_note_photo sn
  JOIN photo p ON p.id = sn.photo_id
  WHERE p.image_id NOT LIKE 'IMGP%'
  GROUP BY note_id
)
SELECT
  id,
  start_height::float,
  end_height::float,
  coalesce(end_height-start_height, 0)::float span,
  coalesce(end_height > start_height, false) has_span,
  symbol,
  coalesce(symbol_min_zoom,0) symbol_min_zoom,
  type,
  coalesce(edited_note, note) note,
  photos
FROM section.section_note n
LEFT JOIN __photo_notes ON n.id = note_id
WHERE section = $1
  AND coalesce(display_in_log, true)
  AND (
    note IS NOT null OR
    edited_note IS NOT null)
ORDER BY start_height
