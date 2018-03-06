UPDATE section.section_lithology
SET
  flooding_surface_order = ${flooding_surface_order}
WHERE section = ${section}
  AND id = ${id}

