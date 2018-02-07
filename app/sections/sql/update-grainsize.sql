UPDATE section.section_lithology
SET
  grainsize = ${grainsize}
WHERE section = ${section}
  AND id = ${id}

