WITH a AS (
SELECT
  sample_id id,
  c.analysis_id,
  c.corr_delta13c avg_delta13c,
  c.corr_delta18o avg_delta18o,
  c.std_delta13c,
  c.std_delta18o,
  section,
  height::numeric orig_height,
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
WHERE height IS NOT null
  AND in_zebra_nappe;

