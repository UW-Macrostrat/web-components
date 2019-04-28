WITH a AS (
SELECT
  sample_id id,
  d.avg_delta13c,
  d.avg_delta18o,
  d.std_delta13c,
  d.std_delta18o,
  section,
  height orig_height,
  n,
  (section.normalized_height(section::text, height::numeric)).*,
  CASE WHEN (section = 'J' AND height < 14.3) THEN
    false
  ELSE
    true
  END AS in_zebra_nappe
FROM carbon_isotopes.analysis_data d
JOIN carbon_isotopes.corrected_data c
  ON d.analysis_id = c.analysis_id
WHERE failure_mode IS null
)
SELECT * FROM a
WHERE height IS NOT null;

