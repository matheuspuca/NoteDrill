-- TEAM MEMBERS RLS POLICIES
-- Enable Row Level Security
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 1. SELECT: Allow authenticated users to view team members (Filtered by user_id normally, but for now allow all authenticated for simplicity if needed, or stick to user_id ownership)
-- Note: The existing queries use .eq('user_id', user.id) usually, but let's allow read for all authenticated to be safe, assuming single tenant logic is handled in app.
DROP POLICY IF EXISTS "Team Members - Select" ON public.team_members;
CREATE POLICY "Team Members - Select" ON public.team_members
    FOR SELECT TO authenticated USING (true);

-- 2. INSERT: Allow authenticated users to insert
DROP POLICY IF EXISTS "Team Members - Insert" ON public.team_members;
CREATE POLICY "Team Members - Insert" ON public.team_members
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE: Allow authenticated users to update their own records or all if they are admins (simplifying to authenticated for MVP)
DROP POLICY IF EXISTS "Team Members - Update" ON public.team_members;
CREATE POLICY "Team Members - Update" ON public.team_members
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 4. DELETE: Allow authenticated users to delete
DROP POLICY IF EXISTS "Team Members - Delete" ON public.team_members;
CREATE POLICY "Team Members - Delete" ON public.team_members
    FOR DELETE TO authenticated USING (true);

-- Grant permissions
GRANT ALL ON TABLE public.team_members TO authenticated;
