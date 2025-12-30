-- SCRIPT MESTRE DE CORREÇÃO (SCHEMA + PERMISSÕES + CORREÇÃO DE ERRO 500)
-- Execute este script para garantir que todos os campos e permissões existam.

BEGIN;

---------------------------------------------------------
-- 1. VERIFICAÇÃO DE CAMPOS (Cria se não existirem)
---------------------------------------------------------

-- Garante que o tipo ENUM existe (Recria para evitar corrupção)
DROP TYPE IF EXISTS app_role CASCADE;
CREATE TYPE app_role AS ENUM ('admin', 'supervisor', 'operator');

-- Tabela PROFILES: Adiciona coluna 'role' se faltar
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role app_role DEFAULT 'operator';
    ELSE
        -- Se já existe, forçamos a conversão para corrigir o erro 500
        ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
        ALTER TABLE public.profiles ALTER COLUMN role TYPE text USING role::text;
        -- Sanitiza dados
        UPDATE public.profiles SET role = 'operator' WHERE role NOT IN ('admin', 'supervisor', 'operator');
        -- Reconverte
        ALTER TABLE public.profiles ALTER COLUMN role TYPE app_role USING role::app_role;
        ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'operator';
    END IF;
END $$;

-- Tabela TEAM_MEMBERS: Adiciona campos de vínculo de usuário
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS linked_user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.team_members ADD COLUMN IF NOT EXISTS email TEXT;

---------------------------------------------------------
-- 2. CORREÇÃO DE PERMISSÕES (RLS)
---------------------------------------------------------

-- Habilita RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Limpa políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Supervisors can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.team_members;

-- Recria Políticas PROFILES
CREATE POLICY "Admins can do everything on profiles" ON public.profiles FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
CREATE POLICY "Supervisors can view all profiles" ON public.profiles FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'supervisor'));
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Recria Políticas TEAM MEMBERS (Acesso Total para usuários logados por enquanto)
CREATE POLICY "Enable all access for authenticated users" ON public.team_members FOR ALL USING (auth.role() = 'authenticated');

---------------------------------------------------------
-- 3. GATILHO DE NOVOS USUÁRIOS (Evita quebrar no futuro)
---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    COALESCE((new.raw_user_meta_data->>'role')::app_role, 'operator'::app_role)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- SUCESSO: Se você ver esta mensagem, o banco foi corrigido.
