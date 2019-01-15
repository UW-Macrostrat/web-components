SELECT * FROM section.section_surface_data
WHERE section = $1::text
ORDER BY bottom;
