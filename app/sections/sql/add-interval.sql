INSERT INTO section.section_lithology
  (section, bottom)
VALUES (${section}, round(${height},2))
RETURNING id
