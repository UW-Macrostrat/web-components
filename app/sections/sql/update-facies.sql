UPDATE section.section_lithology
SET
  facies = ${facies}
WHERE section = ${section}
  AND id = ${id}

