-- Migration to add Registration Number (Matrícula) starting at 1001

-- 1. Add column (initially nullable to avoid locks/issues, then populate)
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS "registrationNumber" INTEGER;

-- 2. Create Sequence starting at 1001
CREATE SEQUENCE IF NOT EXISTS public.team_members_registration_seq START 1001;

-- 3. Set Default
ALTER TABLE public.team_members ALTER COLUMN "registrationNumber" SET DEFAULT nextval('public.team_members_registration_seq');

-- 4. Populate existing rows (if any) with new numbers
-- We use a CTE or simple DO block to assign numbers to existing nulls
WITH to_update AS (
    SELECT id FROM public.team_members WHERE "registrationNumber" IS NULL ORDER BY created_at
)
UPDATE public.team_members
SET "registrationNumber" = nextval('public.team_members_registration_seq')
WHERE id IN (SELECT id FROM to_update);

-- 5. Add unique constraint
ALTER TABLE public.team_members ADD CONSTRAINT team_members_registration_unique UNIQUE ("registrationNumber");
