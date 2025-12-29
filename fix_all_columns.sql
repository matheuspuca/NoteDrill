/* FORCE FIX: Add all potentially missing columns to equipment table */

/* 1. Add hourmeter (Horímetro) */
ALTER TABLE public.equipment 
ADD COLUMN IF NOT EXISTS "hourmeter" numeric DEFAULT 0;

/* 2. Add maintenanceInterval (Intervalo de Manutenção) */
ALTER TABLE public.equipment 
ADD COLUMN IF NOT EXISTS "maintenanceInterval" numeric DEFAULT 250;

/* 3. Add chassis (Chassi/Série) if not exists */
ALTER TABLE public.equipment 
ADD COLUMN IF NOT EXISTS "chassis" text;

/* 4. Add compressorDetails (Detalhes do Compressor) if not exists */
ALTER TABLE public.equipment 
ADD COLUMN IF NOT EXISTS "compressorDetails" jsonb;

/* 5. Refresh schema cache hint */
NOTIFY pgrst, 'reload schema';
