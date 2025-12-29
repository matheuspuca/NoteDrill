/* COMPREHENSIVE REPAIR: Ensure ALL columns exist */

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

/* Refresh schema cache */
NOTIFY pgrst, 'reload schema';
