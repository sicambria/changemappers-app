-- Backfill stored user coordinates so persisted precision matches declared sharing precision.
-- EXACT is intentionally left unchanged.
UPDATE "User"
SET
  "latitude" = CASE "locationPrecision"
    WHEN 'COUNTRY' THEN ROUND("latitude"::numeric, 0)::double precision
    WHEN 'REGION' THEN ROUND("latitude"::numeric, 1)::double precision
    WHEN 'CITY' THEN ROUND("latitude"::numeric, 2)::double precision
    ELSE "latitude"
  END,
  "longitude" = CASE "locationPrecision"
    WHEN 'COUNTRY' THEN ROUND("longitude"::numeric, 0)::double precision
    WHEN 'REGION' THEN ROUND("longitude"::numeric, 1)::double precision
    WHEN 'CITY' THEN ROUND("longitude"::numeric, 2)::double precision
    ELSE "longitude"
  END
WHERE "latitude" IS NOT NULL
  AND "longitude" IS NOT NULL
  AND "locationPrecision" IN ('COUNTRY', 'REGION', 'CITY');

