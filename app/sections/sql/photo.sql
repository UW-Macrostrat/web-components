SELECT
  p.id::integer,
  image_id,
  date,
  geometry,
  coalesce(sn.edited_note, sn.note) note,
  jpeg_path path
FROM photo p
LEFT JOIN section.section_note_photo s
  ON p.id = s.photo_id
LEFT JOIN section.section_note sn
  ON s.note_id = sn.id
WHERE geometry IS NOT null
   OR p.id IN (SELECT photo_id FROM section.section_note_photo)
