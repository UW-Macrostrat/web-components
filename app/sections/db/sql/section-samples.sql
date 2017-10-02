-- Right now this only gets carbon isotope samples
-- but this is mostly what we care about.
WITH isotopes AS (
SELECT
  analysis,
  avg(delta13c) avg_delta13c,
  stddev(delta13c) std_delta13c,
  avg(delta18o) avg_delta18o,
  stddev(delta18o) std_delta18o,
  count(*) AS n
FROM carbon_isotopes.analysis_peak p
JOIN carbon_isotopes.analysis a USING (analysis)
WHERE peak_type = 'data'
  AND NOT a.is_standard
GROUP BY (analysis)
)
SELECT DISTINCT ON (height)
  isotopes.*,
  sample_id,
  height,
  section,
  a.date
FROM isotopes
JOIN carbon_isotopes.analysis a USING (analysis)
LEFT JOIN carbon_isotopes.analysis_failure f
  ON a.sample_id = f.id
  AND a.date = f.date
WHERE failure_mode IS null
  AND std_delta13c IS NOT null
  AND n >= 3
  AND section=$1
ORDER BY height;
