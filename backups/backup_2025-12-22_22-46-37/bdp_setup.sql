-- Database Setup for SmartDrill BDP V2
-- Includes tables for Projects, Team, Equipment, and the updated BDP Reports

-- 1. Projects (Obras)
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  status text DEFAULT 'Planejamento',
  city text,
  address text,
  start_date date,
  end_date date
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Projects - All Access" ON public.projects;
CREATE POLICY "Projects - All Access" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.projects TO authenticated;

-- 2. Team (Equipe)
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  role text NOT NULL, -- 'Operador', 'Ajudante', 'Supervisor', etc.
  status text DEFAULT 'Ativo'
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team - All Access" ON public.team_members;
CREATE POLICY "Team - All Access" ON public.team_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.team_members TO authenticated;

-- 3. Equipment (Equipamentos)
CREATE TABLE IF NOT EXISTS public.equipment (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  
  -- Core Fields
  "internalCode" text,
  "name" text NOT NULL,
  "type" text NOT NULL, -- 'Hidráulica', 'Pneumática', 'Compressor', etc.
  "model" text,
  "manufacturer" text,
  "year" numeric,
  "chassis" text,
  
  -- Maintenance & Status
  "status" text DEFAULT 'Operacional',
  "hourmeter" numeric DEFAULT 0,
  "maintenanceInterval" numeric DEFAULT 250, -- e.g. every 250h
  
  -- Nested Data
  "compressorDetails" jsonb DEFAULT '{}'::jsonb -- Stores brand, model, serial for attached unit
);
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Equipment - All Access" ON public.equipment;
CREATE POLICY "Equipment - All Access" ON public.equipment FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.equipment TO authenticated;


-- 4. BDP Reports (Recreating to match V2 Schema)
-- We will DROP the old table to ensure clean schema (since it was just created today/yesterday)
DROP TABLE IF EXISTS public.bdp_reports;

CREATE TABLE public.bdp_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  
  -- Header Relations
  "date" date NOT NULL,
  "shift" text NOT NULL, -- 'Diurno', 'Noturno'
  "projectId" uuid REFERENCES public.projects(id),
  "operatorId" uuid REFERENCES public.team_members(id),
  "helperId" uuid REFERENCES public.team_members(id),
  "drillId" uuid REFERENCES public.equipment(id),
  "compressorId" uuid REFERENCES public.equipment(id),

  -- Time & Counters
  "hourmeterStart" numeric,
  "hourmeterEnd" numeric,
  "startTime" text,
  "endTime" text,

  -- Params
  "holeDiameter" numeric,
  "targetDepth" numeric,
  "actualDepth" numeric,
  "angle" numeric,
  "azimuth" numeric,

  -- Geology
  "materialDescription" text,
  "lithologyProfile" text,
  "penetrationTime" text,

  -- Services
  "selectedServices" text[] DEFAULT '{}',
  "holes" jsonb DEFAULT '[]'::jsonb, -- Array of { holeNumber, depth, ... }
  "totalMeters" numeric,
  "averageHeight" numeric,
  "totalHours" numeric,

  -- Occurrences (JSON Array of { type, timeStart, timeEnd, description })
  "occurrences" jsonb DEFAULT '[]'::jsonb,

  -- Supplies (JSON Array of { type, quantity })
  "supplies" jsonb DEFAULT '[]'::jsonb
);

ALTER TABLE public.bdp_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "BDP - All Access" ON public.bdp_reports;
CREATE POLICY "BDP - All Access" ON public.bdp_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.bdp_reports TO authenticated;
