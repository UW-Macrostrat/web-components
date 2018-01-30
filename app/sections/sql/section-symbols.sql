SELECT
  id,
  section,
  symbol,
  (
    start_height+coalesce(
    end_height,start_height)
  )/2 height
FROM section.section_note
WHERE symbol IS NOT null
  AND section = $1
