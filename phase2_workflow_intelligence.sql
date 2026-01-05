-- UPGRADE v2.5: Workflow & Intelligence
-- 1. BDP Approval Workflow
-- 2. Bit Performance Tracking

-- A. BDP STATUS PIPELINE
-- Add status column with constraints
ALTER TABLE public.bdp_reports 
ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'PENDENTE';

ALTER TABLE public.bdp_reports 
DROP CONSTRAINT IF EXISTS bdp_status_check;

ALTER TABLE public.bdp_reports 
ADD CONSTRAINT bdp_status_check 
CHECK (status IN ('PENDENTE', 'APROVADO', 'REJEITADO'));

-- B. BIT TRACKING INTELLIGENCE
-- 1. Create Bit Instances Table (Tracking unique serial numbers)
CREATE TABLE IF NOT EXISTS public.bit_instances (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "inventory_item_id" uuid REFERENCES public.inventory_items(id) ON DELETE CASCADE,
    "serial_number" text NOT NULL,
    "status" text DEFAULT 'EM_USO' CHECK (status IN ('EM_USO', 'DESCARTADO')),
    "created_at" timestamptz DEFAULT now(),
    "discarded_at" timestamptz,
    "project_id" uuid REFERENCES public.projects(id), -- Optional: Link bit to initial project
    UNIQUE("serial_number", "inventory_item_id")
);

-- 2. Link BDP to Bit Instance
ALTER TABLE public.bdp_reports
ADD COLUMN IF NOT EXISTS "bit_instance_id" uuid REFERENCES public.bit_instances(id);

-- C. RLS POLICIES FOR WORKFLOW

-- 1. Enable RLS on bit_instances
ALTER TABLE public.bit_instances ENABLE ROW LEVEL SECURITY;

-- Note: We assume basic RLS (users see what they have access to via project/works)
-- For simplicity in this step, we allow Authenticated Read, Insert/Update by 'Supervisor' or context.
CREATE POLICY "Enable read access for all authenticated users" ON public.bit_instances
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.bit_instances
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON public.bit_instances
FOR UPDATE TO authenticated USING (true);


-- 2. BDP Status Logic (Trigger-based protection or RLS Check)
-- Ideally, we'd use a Trigger to prevent 'Operator' from changing status != PENDENTE, but for V2.5 we will control this in the Server Action (Business Logic Layer) to reduce SQL complexity, as requested "Logic heavy in backend" usually implies Server Actions in Next.js context, but let's add a robust function for the Bit Calc.

-- D. CALCULATION FUNCTIONS (Intelligence)

CREATE OR REPLACE FUNCTION get_bit_performance_stats(p_bit_instance_id uuid)
RETURNS TABLE (
    total_meters numeric,
    total_hours numeric,
    bdp_count bigint,
    average_meters_per_hour numeric
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(b.meters_drilled), 0) as total_meters,
        COALESCE(SUM(b.hours_worked), 0) as total_hours,
        COUNT(b.id) as bdp_count,
        CASE 
            WHEN SUM(b.hours_worked) > 0 THEN (SUM(b.meters_drilled) / SUM(b.hours_worked))
            ELSE 0 
        END as average_meters_per_hour
    FROM bdp_reports b
    WHERE b.bit_instance_id = p_bit_instance_id
    AND b.status = 'APROVADO'; -- Only approved reports could toward performance
END;
$$;
