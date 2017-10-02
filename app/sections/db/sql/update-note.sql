UPDATE section.section_note
SET edited_note = $2::text
WHERE id = $1::integer
