/* Fix missing columns in equipment table */

ALTER TABLE public.equipment 
ADD COLUMN IF NOT EXISTS "chassis" text,
ADD COLUMN IF NOT EXISTS "compressorDetails" jsonb;

/* Ensure other columns exist just in case */
ALTER TABLE public.equipment 
ADD COLUMN IF NOT EXISTS "internalCode" text,
ADD COLUMN IF NOT EXISTS "manufacturer" text,
ADD COLUMN IF NOT EXISTS "hourmeter" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "maintenanceInterval" numeric DEFAULT 250;
