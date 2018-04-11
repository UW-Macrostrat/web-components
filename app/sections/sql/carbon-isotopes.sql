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
),
v AS (
SELECT DISTINCT ON (analysis)
  isotopes.*,
  sample_id,
  height::numeric height,
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
ORDER BY analysis, height
),
z AS (
SELECT
  section || '-' || height::text id,
  sum(avg_delta13c*n)/sum(n) avg_delta13c,
  sum(avg_delta18o*n)/sum(n) avg_delta18o,
  sqrt(sum(power(std_delta13c, 2)*n)/sum(n)) std_delta13c,
  sqrt(sum(power(std_delta18o, 2)*n)/sum(n)) std_delta18o,
  section,
  height orig_height,
  sum(n) n,
  (section.normalized_height(section::text, height::numeric)).*,
  CASE WHEN (section = 'J' AND height < 14.3) THEN
    false
  ELSE
    true
  END AS in_zebra_nappe
FROM v
GROUP BY (section, height)
)
SELECT * FROM z ORDER BY height;
