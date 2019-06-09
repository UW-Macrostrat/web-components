WITH a AS (
SELECT
  s.id,
  a.id analysis_name,
  c.analysis_id,
  c.corr_delta13c avg_delta13c,
  c.corr_delta18o avg_delta18o,
  c.std_delta13c,
  c.std_delta18o,
  s.section,
  s.height::numeric orig_height,
  coalesce(a.failure_mode, ss.failure_mode) failure_mode,
  (section.normalized_height(section::text, height::numeric)).*,
  CASE WHEN (section = 'J' AND height < 14.3) THEN
    false
  ELSE
    true
  END AS in_zebra_nappe
FROM carbon_isotopes.analysis a
JOIN carbon_isotopes.sample s
  ON s.id = a.sample_id
JOIN carbon_isotopes.corrected_data c
  ON a.analysis_id = c.analysis_id
JOIN carbon_isotopes.analysis_session ss
  ON ss.date = a.date
)
SELECT * FROM a
WHERE height IS NOT null
  AND in_zebra_nappe
  AND failure_mode IS null
ORDER BY height;

