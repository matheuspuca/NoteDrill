-- COMPREHENSIVE FIX FOR NOTEDRILL PERMISSIONS
-- Run this in Supabase SQL Editor to fix "Delete Member" and "Save Maintenance" issues.

-- 1. TEAM MEMBERS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team Full Access" ON public.team_members;
CREATE POLICY "Team Full Access" ON public.team_members
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 2. MAINTENANCE EVENTS
ALTER TABLE public.maintenance_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Maintenance Full Access" ON public.maintenance_events;
CREATE POLICY "Maintenance Full Access" ON public.maintenance_events
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 3. EQUIPMENT
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Equipment Full Access" ON public.equipment;
CREATE POLICY "Equipment Full Access" ON public.equipment
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 4. INVENTORY & EPIs (Just in case)
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_epis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.epi_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inventory Items Full Access" ON public.inventory_items;
CREATE POLICY "Inventory Items Full Access" ON public.inventory_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "EPIs Full Access" ON public.inventory_epis;
CREATE POLICY "EPIs Full Access" ON public.inventory_epis FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "EPI Usage Full Access" ON public.epi_usage;
CREATE POLICY "EPI Usage Full Access" ON public.epi_usage FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
