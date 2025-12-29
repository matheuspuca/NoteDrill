/* Database Setup for Equipment */

CREATE TABLE IF NOT EXISTS public.equipment (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  
  "internalCode" text NOT NULL,
  "name" text NOT NULL,
  "type" text NOT NULL, -- Hidráulica, Pneumática, Compressor, Veículo, Outros
  "model" text NOT NULL,
  "manufacturer" text NOT NULL,
  "year" numeric DEFAULT extract(year from now()),
  "chassis" text NOT NULL,
  
  "status" text DEFAULT 'Operacional',
  "hourmeter" numeric DEFAULT 0,
  "maintenanceInterval" numeric DEFAULT 250,
  
  "compressorDetails" jsonb -- Stores nested object { brand, model, year, serialNumber, hourmeter }
);

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Equipment - All Access" ON public.equipment;
CREATE POLICY "Equipment - All Access" ON public.equipment FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.equipment TO authenticated;
