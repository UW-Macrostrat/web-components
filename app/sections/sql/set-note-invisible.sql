UPDATE section.section_note
SET display_in_log = false
WHERE id = $1::integer
