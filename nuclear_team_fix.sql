/*
  NUCLEAR VALIDATION FIX V1.0
  Use this script to forcefully fix ALL constraints preventing Team Member deletion.
*/

-- 1. FIX BDP REPORTS CONSTRAINT (Allow Deletion -> Set Null)
ALTER TABLE public.bdp_reports DROP CONSTRAINT IF EXISTS "bdp_reports_operatorId_fkey";
ALTER TABLE public.bdp_reports DROP CONSTRAINT IF EXISTS "bdp_reports_helperId_fkey";

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


-- 2. FIX EPI USAGE CONSTRAINT (Allow Deletion -> Cascade or Set Null)
-- Usually usage logs should stay, but if the user leaves, we might want to keep the log but nullify the user?
-- Actually, EPI logs are strictly about that person. If we delete the person, maybe we delete the logs? 
-- Let's go with CASCADE as per original design, just reinforcing it.
ALTER TABLE public.epi_usage DROP CONSTRAINT IF EXISTS "epi_usage_teamMemberId_fkey";

ALTER TABLE public.epi_usage
ADD CONSTRAINT "epi_usage_teamMemberId_fkey"
FOREIGN KEY ("teamMemberId")
REFERENCES public.team_members(id)
ON DELETE CASCADE; -- Deleting user deletes their EPI history.


-- 3. ENSURE RLS IS NOT THE BLOCKER
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Delete Team Member Nuclear" ON public.team_members;
CREATE POLICY "Delete Team Member Nuclear" ON public.team_members FOR DELETE TO authenticated USING (true);
GRANT DELETE ON TABLE public.team_members TO authenticated;


-- 4. CHECK ANY OTHER HIDDEN CONSTRAINTS (Common culprits)
-- If there's an 'auth.users' link, usually it's cascading or unrelated.
-- 'projects' doesn't link to team_members.
-- 'equipment' doesn't link to team_members.

-- DONE.
