/*
  Asset Management (Patrimônio) Table
  Linked to Projects.
*/

CREATE TABLE IF NOT EXISTS public.project_assets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  
  name text NOT NULL,
  purchase_date date,
  invoice_number text, -- numero da NF
  value numeric(12, 2) DEFAULT 0,
  quantity numeric DEFAULT 1,
  tag_number text, -- tag de identificação (pode ser alfanumérico)
  
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL, -- Se deletar obra, mantem ativo mas sem link? Ou cascade? Set Null é seguro.
  
  description text
);

-- RLS
ALTER TABLE public.project_assets ENABLE ROW LEVEL SECURITY;

-- POLICIES
DROP POLICY IF EXISTS "Assets - Full Access" ON public.project_assets;
CREATE POLICY "Assets - Full Access" ON public.project_assets
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Permissions
GRANT ALL ON TABLE public.project_assets TO authenticated;
