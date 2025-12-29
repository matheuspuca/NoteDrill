/* === SMARTDRILL DATABASE RECOVERY POINT - 2025-12-27 === */
/* This script applies ALL necessary columns and fixes for Equipment and Inventory modules */

/* 1. EQUIPMENT TABLE */
ALTER TABLE public.equipment 
ADD COLUMN IF NOT EXISTS "internalCode" text,
ADD COLUMN IF NOT EXISTS "name" text,
ADD COLUMN IF NOT EXISTS "type" text,
ADD COLUMN IF NOT EXISTS "model" text,
ADD COLUMN IF NOT EXISTS "manufacturer" text,
ADD COLUMN IF NOT EXISTS "year" numeric DEFAULT extract(year from now()),
ADD COLUMN IF NOT EXISTS "chassis" text,
ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'Operacional',
ADD COLUMN IF NOT EXISTS "hourmeter" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "maintenanceInterval" numeric DEFAULT 250,
ADD COLUMN IF NOT EXISTS "compressorDetails" jsonb;

/* 2. INVENTORY ITEMS TABLE (Materials/Tools) */
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS "value" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "minStock" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'Material',
ADD COLUMN IF NOT EXISTS "brand" text;

/* 3. INVENTORY EPIS TABLE */
ALTER TABLE public.inventory_epis 
ADD COLUMN IF NOT EXISTS "value" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "minStock" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'EPI';

/* 4. REFRESH CACHE */
NOTIFY pgrst, 'reload schema';
