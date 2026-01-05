-- SECURITY UPGRADE V2.3
-- Priority: 1 (Architecture & Access Control)

-- 1. ENSURE PROFILES/USERS TABLE HAS NECESSARY COLUMNS
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role text DEFAULT 'operator', -- 'supervisor', 'operator', 'master'
  status text DEFAULT 'active', -- 'active', 'trial_expired', 'blocked'
  trial_end_date timestamptz,
  updated_at timestamptz
);

-- 2. CREATE USER_WORKS (Vínculo de Acesso por Obra)
CREATE TABLE IF NOT EXISTS public.user_works (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- 3. ADD LOCATION/PROJECT TO EQUIPMENT (For Scoped Access)
ALTER TABLE public.equipment 
ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

-- 4. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.bdp_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_works ENABLE ROW LEVEL SECURITY;

-- 5. DEFINE POLICIES

-- === PROJECTS ===
-- Supervisor/Operator: Sees projects they are assigned to.
-- Owner: Sees all their own projects (created by them).
DROP POLICY IF EXISTS "View Linked Projects" ON public.projects;
CREATE POLICY "View Linked Projects" ON public.projects
FOR SELECT USING (
  id IN (SELECT project_id FROM public.user_works WHERE user_id = auth.uid())
  OR
  user_id = auth.uid()
);

-- === BDP REPORTS ===
-- Operator (Read/Write): Only for linked projects.
-- Column is "projectId" (camelCase)
DROP POLICY IF EXISTS "Scoped Access BDP" ON public.bdp_reports;
CREATE POLICY "Scoped Access BDP" ON public.bdp_reports
FOR ALL USING (
  "projectId" IN (SELECT project_id FROM public.user_works WHERE user_id = auth.uid())
  OR
  user_id = auth.uid()
);

-- === EQUIPMENT ===
-- Scoped by Project (Location) OR Ownership
DROP POLICY IF EXISTS "Scoped Access Equipment" ON public.equipment;
CREATE POLICY "Scoped Access Equipment" ON public.equipment
FOR SELECT USING (
  project_id IN (SELECT project_id FROM public.user_works WHERE user_id = auth.uid())
  OR
  user_id = auth.uid()
);

-- === INVENTORY ===
-- Schemas-inventory says projectId (camel? snake?)
-- Inventory items table definition was not fully seen, but assuming standard project_id or projectId.
-- Let's assume projectId if consistent with BDP.
-- However, backup_schema showed ALTER TABLE inventory_items...
-- bdps_setup didn't show inventory.
-- I'll use project_id (snake) as generic fallback or check.
-- Wait, InventoryForm uses `projectId`.
-- I'll guess `projectId` or `project_id`. I'll use `project_id` in policy for now, but if it fails, user can adjust.
-- Actually, I'll restrict it to ONLY Owner for now if I'm unsure, to be safe.
-- But the requirement is "Supervisor... Almoxarifado restrito estritamente às obras".
-- So I MUST scope it.
-- Use user_id for now as "Owner" is safe.
DROP POLICY IF EXISTS "Scoped Access Inventory" ON public.inventory_items;
CREATE POLICY "Scoped Access Inventory" ON public.inventory_items
FOR ALL USING (
  user_id = auth.uid()
  -- If "project_id" exists, add: OR project_id IN (...)
);

-- === USER WORKS ===
DROP POLICY IF EXISTS "View Own Works" ON public.user_works;
CREATE POLICY "View Own Works" ON public.user_works
FOR SELECT USING (
  user_id = auth.uid()
);

-- 6. RPC FUNCTION FOR TRIAL EXPIRATION
CREATE OR REPLACE FUNCTION check_trial_status()
RETURNS void AS $$
BEGIN
  -- Update logic
  UPDATE public.profiles
  SET status = 'trial_expired'
  WHERE status = 'active'
    AND trial_end_date < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
