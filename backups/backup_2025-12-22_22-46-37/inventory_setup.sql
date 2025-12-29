/* Database Setup for SmartDrill Inventory & EPIs */
/* Run this in Supabase SQL Editor */

/* 5. Inventory Items (Almoxarifado) - Already Created? If not, run this block */
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  
  "name" text NOT NULL,
  "projectId" uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  "unit" text NOT NULL,
  "brand" text,
  "quantity" numeric DEFAULT 0,
  "value" numeric DEFAULT 0,
  "minStock" numeric DEFAULT 0
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inventory - All Access" ON public.inventory_items;
CREATE POLICY "Inventory - All Access" ON public.inventory_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.inventory_items TO authenticated;


/* 6. EPIs (Equipamento de Proteção Individual) */
CREATE TABLE IF NOT EXISTS public.inventory_epis (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  
  "name" text NOT NULL,
  "ca" text NOT NULL, -- Certificado de Aprovação
  "projectId" uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  "unit" text NOT NULL,
  "quantity" numeric DEFAULT 0,
  "expirationDate" date,
  "size" text -- Tamanho (P, M, G, 40, 42, etc.)
);

ALTER TABLE public.inventory_epis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "EPI - All Access" ON public.inventory_epis;
CREATE POLICY "EPI - All Access" ON public.inventory_epis FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON TABLE public.inventory_epis TO authenticated;
