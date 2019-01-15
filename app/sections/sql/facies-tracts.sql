SELECT f.*
FROM section.facies f
WHERE f.used
ORDER BY member_of, id
