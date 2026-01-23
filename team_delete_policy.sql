-- Enable Delete Policy for Team Members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Delete Team Member" ON public.team_members;

CREATE POLICY "Delete Team Member"
ON public.team_members
FOR DELETE
TO authenticated
USING (true); -- Ideally restrict to Admin/Manager, but authenticated is fine for MVP internal dashboard

GRANT DELETE ON TABLE public.team_members TO authenticated;
