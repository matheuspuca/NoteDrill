-- Upgrade Inventory Schema (V2)

-- 1. Add Type column if not exists (Action.ts assumed it existed but schema.sql didn't show it)
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'Material';

-- 2. Add New Tracking Fields
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS "model" text;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS "supplier" text;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS "entry_date" date;
ALTER TABLE public.inventory_items ADD COLUMN IF NOT EXISTS "invoice_number" text;

-- 3. Add Tracking Fields to EPIs
ALTER TABLE public.inventory_epis ADD COLUMN IF NOT EXISTS "model" text;
ALTER TABLE public.inventory_epis ADD COLUMN IF NOT EXISTS "supplier" text;
ALTER TABLE public.inventory_epis ADD COLUMN IF NOT EXISTS "entry_date" date;
ALTER TABLE public.inventory_epis ADD COLUMN IF NOT EXISTS "invoice_number" text;
