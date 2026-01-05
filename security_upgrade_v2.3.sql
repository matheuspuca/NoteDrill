/* === SECURITY UPGRADE V2.3 === */

/* 1. PROJECT MEMBERS (Usuario - Obra) */
CREATE TABLE IF NOT EXISTS public.project_members (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role text DEFAULT 'operator', /* operator, supervisor */
    created_at timestamptz DEFAULT now(),
    UNIQUE(project_id, user_id)
);

/* 2. RLS FOR PROJECT MEMBERS */
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all project members"
ON public.project_members
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

CREATE POLICY "Supervisors view project members"
ON public.project_members
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'supervisor'
  )
);

CREATE POLICY "Users view their own project memberships"
ON public.project_members
FOR SELECT
USING (auth.uid() = user_id);

/* 3. ENSURE PROFILES ROLE COLUMN EXISTS (Safe Check) */
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'operator';
    END IF;
END $$;

/* 4. REFRESH SCHEMA CACHE */
NOTIFY pgrst, 'reload schema';