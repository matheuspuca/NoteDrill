-- --- SOLUÇÃO URGENTE PARA ERRO 500 ---
-- COPIE E COLE TUDO ISSO NO SQL EDITOR DO SUPABASE E CLIQUE EM RUN

BEGIN;

-- 1. Remove políticas antigas que travam a mudança
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Supervisors can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 2. Converte a coluna para Texto (Salva os dados)
ALTER TABLE public.profiles 
ALTER COLUMN role DROP DEFAULT,
ALTER COLUMN role TYPE text USING role::text;

-- 3. Corrige dados inválidos (ex: 'viewer' vira 'operator')
UPDATE public.profiles 
SET role = 'operator' 
WHERE role NOT IN ('admin', 'supervisor', 'operator');

-- 4. Recria o Tipo de Permissão (Limpo)
DROP TYPE IF EXISTS app_role;
CREATE TYPE app_role AS ENUM ('admin', 'supervisor', 'operator');

-- 5. Aplica o novo tipo na coluna
ALTER TABLE public.profiles 
ALTER COLUMN role TYPE app_role USING role::app_role,
ALTER COLUMN role SET DEFAULT 'operator';

-- 6. Recria as Regras de Segurança (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on profiles" ON public.profiles FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
CREATE POLICY "Supervisors can view all profiles" ON public.profiles FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'supervisor'));
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

COMMIT;

-- FIM DO SCRIPT
