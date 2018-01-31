SELECT f.*
FROM section.facies f
WHERE f.id IN (SELECT facies FROM section.section_lithology)
ORDER BY member_of, id
