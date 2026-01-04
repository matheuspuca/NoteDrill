-- Upgrade v2.2: Asset Management & Maintenance

-- 1. Update Equipment Table
-- Add ownership and cost fields
ALTER TABLE equipment
ADD COLUMN IF NOT EXISTS ownership_type text NOT NULL DEFAULT 'OWNED' CHECK (ownership_type IN ('OWNED', 'RENTED')),
ADD COLUMN IF NOT EXISTS rental_company_name text,
ADD COLUMN IF NOT EXISTS rental_cost_monthly numeric(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS depreciation_cost_monthly numeric(10, 2) DEFAULT 0.00;

-- 2. Create Maintenance Events Table
CREATE TABLE IF NOT EXISTS maintenance_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    equipment_id uuid NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    date timestamp with time zone NOT NULL,
    type text NOT NULL CHECK (type IN ('REVISION', 'PREVENTIVE', 'CORRECTIVE')),
    status text NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED')),
    hour_meter numeric(10, 1) NOT NULL,
    cost numeric(10, 2) DEFAULT 0.00,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid NOT NULL DEFAULT auth.uid()
);

-- Add RLS Policies for maintenance_events
ALTER TABLE maintenance_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'maintenance_events' AND policyname = 'Users can view their own maintenance events'
    ) THEN
        CREATE POLICY "Users can view their own maintenance events"
            ON maintenance_events FOR SELECT
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'maintenance_events' AND policyname = 'Users can insert their own maintenance events'
    ) THEN
        CREATE POLICY "Users can insert their own maintenance events"
            ON maintenance_events FOR INSERT
            WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'maintenance_events' AND policyname = 'Users can update their own maintenance events'
    ) THEN
        CREATE POLICY "Users can update their own maintenance events"
            ON maintenance_events FOR UPDATE
            USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'maintenance_events' AND policyname = 'Users can delete their own maintenance events'
    ) THEN
        CREATE POLICY "Users can delete their own maintenance events"
            ON maintenance_events FOR DELETE
            USING (auth.uid() = user_id);
    END IF;
END
$$;
