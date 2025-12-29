/* Team V2 - HR & EPI Management */

/* 1. Update Team Members Table */
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS "birthDate" date,
ADD COLUMN IF NOT EXISTS "admissionDate" date,
ADD COLUMN IF NOT EXISTS "asoDate" date;

/* 2. EPI Usage / Distribution Log */
CREATE TABLE IF NOT EXISTS public.epi_usage (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  
  "teamMemberId" uuid REFERENCES public.team_members(id) ON DELETE CASCADE,
  "epiId" uuid REFERENCES public.inventory_epis(id) ON DELETE CASCADE,
  
  "quantity" numeric NOT NULL DEFAULT 1,
  "date" date DEFAULT CURRENT_DATE,
  "notes" text
);

ALTER TABLE public.epi_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "EPI Usage - All Access" ON public.epi_usage;
CREATE POLICY "EPI Usage - All Access" ON public.epi_usage FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.epi_usage TO authenticated;
