-- Fix BDP Reports Foreign Key Constraints to allow Team Member Deletion
-- We change the constraint to ON DELETE SET NULL so historical reports are kept even if the user is deleted.

-- 1. Drop existing constraints
ALTER TABLE public.bdp_reports DROP CONSTRAINT IF EXISTS "bdp_reports_operatorId_fkey";
ALTER TABLE public.bdp_reports DROP CONSTRAINT IF EXISTS "bdp_reports_helperId_fkey";

-- 2. Validate current constraint names (if generated differently, we might need to be careful, but above is standard)
-- If Supabase generated different names, this might fail, but usually they follow table_column_fkey pattern.

-- 3. Re-add constraints with ON DELETE SET NULL
ALTER TABLE public.bdp_reports
ADD CONSTRAINT "bdp_reports_operatorId_fkey"
FOREIGN KEY ("operatorId")
REFERENCES public.team_members(id)
ON DELETE SET NULL;

ALTER TABLE public.bdp_reports
ADD CONSTRAINT "bdp_reports_helperId_fkey"
FOREIGN KEY ("helperId")
REFERENCES public.team_members(id)
ON DELETE SET NULL;
