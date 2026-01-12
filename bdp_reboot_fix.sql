-- BDP Table Re-Architecture: Standardization to snake_case
-- This script replaces the previous bdp_reports table to eliminate quoted identifier issues.

DROP TABLE IF EXISTS public.bdp_reports CASCADE;

-- Recreate Sequence if not exists
CREATE SEQUENCE IF NOT EXISTS bdp_report_seq START 1;

CREATE TABLE public.bdp_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  
  -- Header Relations
  date date NOT NULL,
  shift text NOT NULL, -- 'Diurno', 'Noturno'
  project_id uuid REFERENCES public.projects(id),
  operator_id uuid REFERENCES public.team_members(id),
  helper_id uuid REFERENCES public.team_members(id),
  drill_id uuid REFERENCES public.equipment(id),
  compressor_id uuid REFERENCES public.equipment(id),

  -- Time & Counters
  hourmeter_start numeric,
  hourmeter_end numeric,
  start_time text,
  end_time text,

  -- Params
  hole_diameter numeric,
  target_depth numeric,
  actual_depth numeric,
  angle numeric,
  azimuth numeric,

  -- Geology
  material_description text,
  lithology_profile text,
  penetration_time text,
  rock_status text,           -- V2.1 feature
  rock_status_reason text,    -- V2.1 feature

  -- Services
  selected_services text[] DEFAULT '{}',
  holes jsonb DEFAULT '[]'::jsonb, -- Array of { holeNumber, depth, ... }
  total_meters numeric,
  average_height numeric,
  total_hours numeric,

  -- Occurrences & Supplies
  occurrences jsonb DEFAULT '[]'::jsonb,
  supplies jsonb DEFAULT '[]'::jsonb,

  -- Workflow & Meta
  status text DEFAULT 'PENDENTE', -- 'PENDENTE', 'APROVADO', 'REJEITADO'
  report_number INTEGER DEFAULT nextval('bdp_report_seq') UNIQUE
);

ALTER TABLE public.bdp_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "BDP - All Access" ON public.bdp_reports;
CREATE POLICY "BDP - All Access" ON public.bdp_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.bdp_reports TO authenticated;
