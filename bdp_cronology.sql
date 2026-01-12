-- Migration to add chronological numbering to BDP Reports

-- 1. Create Sequence
CREATE SEQUENCE IF NOT EXISTS bdp_report_seq START 1;

-- 2. Add Column with Default
ALTER TABLE bdp_reports 
ADD COLUMN IF NOT EXISTS "reportNumber" INTEGER DEFAULT nextval('bdp_report_seq');

-- 3. Backfill existing records (if they are null)
-- This ensures strict ordering based on creation time for existing records
WITH ranked_bdp AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM bdp_reports
  WHERE "reportNumber" IS NULL
)
UPDATE bdp_reports
SET "reportNumber" = ranked_bdp.rn
FROM ranked_bdp
WHERE bdp_reports.id = ranked_bdp.id;

-- 4. Add Unique Constraint just in case (Good practice, though sequence handles it mostly)
ALTER TABLE bdp_reports 
ADD CONSTRAINT bdp_report_number_unique UNIQUE ("reportNumber");
