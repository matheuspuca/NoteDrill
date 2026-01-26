/*
  Plano de Fogo (Blasting Plan) Table
  Linked to Projects (Obras).
  Groups multiple BDPs.
*/

-- 1. Create Plano de Fogo Table
CREATE TABLE IF NOT EXISTS public.plano_de_fogo (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id),
  
  name text NOT NULL, -- Nome ou identificação do plano
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  
  status text DEFAULT 'Aberto', -- 'Aberto', 'Concluído'
  finished_at timestamptz, -- Data de finalização
  
  description text
);

-- 2. RLS Security
ALTER TABLE public.plano_de_fogo ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "PlanoFogo - Full Access" ON public.plano_de_fogo;
CREATE POLICY "PlanoFogo - Full Access" ON public.plano_de_fogo
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 4. Permissions
GRANT ALL ON TABLE public.plano_de_fogo TO authenticated;

-- 5. Link BDP to Plano de Fogo
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bdp_reports' AND column_name = 'plano_de_fogo_id') THEN
        ALTER TABLE public.bdp_reports 
        ADD COLUMN plano_de_fogo_id uuid REFERENCES public.plano_de_fogo(id) ON DELETE SET NULL;
    END IF;
END $$;
