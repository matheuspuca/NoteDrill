-- 1. HABILITAR RLS NA TABELA PROJECTS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 2. GARANTIR GRANTS (Permissões básicas)
GRANT ALL ON public.projects TO postgres;
GRANT ALL ON public.projects TO service_role;
GRANT ALL ON public.projects TO authenticated;

-- 3. LIMPAR POLICIES ANTIGAS (Para evitar conflitos)
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
DROP POLICY IF EXISTS "Enable all actions for users based on user_id" ON public.projects;

-- 4. CRIAR POLICY UNIFICADA
-- Permite SELECT, INSERT, UPDATE, DELETE apenas se o user_id bater com o auth.uid()
CREATE POLICY "Enable all actions for users based on user_id" ON public.projects
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
