-- 1. ADICIONAR COLUNAS FALTANTES (Com verificação se já existem)
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS contract_number text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS volume_m3 numeric;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS responsible_engineer text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS responsible_phone text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS zip_code text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status text DEFAULT 'Planejamento';

-- 2. REFORÇAR PERMISSÕES (RLS)
-- Garante que a segurança está ativa
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Grants básicos
GRANT ALL ON public.projects TO postgres;
GRANT ALL ON public.projects TO service_role;
GRANT ALL ON public.projects TO authenticated;

-- 3. RECRIAR POLICIES (Para garantir que funcionem)
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
DROP POLICY IF EXISTS "Enable all actions for users based on user_id" ON public.projects;

-- Policy Vencendora: Permite tudo se o usuário for o dono
CREATE POLICY "Enable all actions for users based on user_id" ON public.projects
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. RECARREGAR O CACHE DO SCHEMA (Importante para o erro PGRST204)
NOTIFY pgrst, 'reload config';
