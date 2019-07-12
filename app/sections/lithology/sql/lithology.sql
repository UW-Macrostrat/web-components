SELECT
	id,
	coalesce(pattern, id) pattern
FROM section.lithology
