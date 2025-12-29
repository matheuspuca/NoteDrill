-- SCRIPT DE CORREÇÃO TOTAL (EMPRESA + PERFIL)
-- Execute este script no Editor SQL do Supabase

-- ==============================================================================
-- 1. TABELA DE PERFIL (PROFILES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users(id) PRIMARY KEY,
    updated_at timestamptz DEFAULT now(),
    username text UNIQUE,
    full_name text,
    avatar_url text,
    website text
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grants (Permissões de acesso)
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO authenticated;

-- Limpar policies antigas
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable all actions for users based on id" ON public.profiles;

-- Criar Policy Unificada para Profiles
CREATE POLICY "Enable all actions for users based on id" ON public.profiles
    FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Permitir leitura pública de perfis (opcional, mas comum)
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT
    USING (true);

-- ==============================================================================
-- 2. TABELA DA EMPRESA (COMPANY_SETTINGS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.company_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
    company_name text,
    cnpj text,
    address text,
    email text,
    phone text,
    logo_url text,
    website text
);

-- Habilitar RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON public.company_settings TO postgres;
GRANT ALL ON public.company_settings TO service_role;
GRANT ALL ON public.company_settings TO authenticated;

-- Limpar policies antigas
DROP POLICY IF EXISTS "Enable all actions for users based on user_id" ON public.company_settings;

-- Criar Policy Unificada para Company Settings
CREATE POLICY "Enable all actions for users based on user_id" ON public.company_settings
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 3. STORAGE (ARQUIVOS)
-- ==============================================================================
-- Garantir buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- Grants Storage
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Limpar Policies Antigas de Storage
DROP POLICY IF EXISTS "Logos Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Logos Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Avatars Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatars Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Storage Access Policy" ON storage.objects;

-- Policy Genérica de Acesso aos Buckets criados
CREATE POLICY "Storage Access Policy" ON storage.objects
    FOR ALL
    USING (bucket_id IN ('company-logos', 'avatars') AND auth.role() = 'authenticated')
    WITH CHECK (bucket_id IN ('company-logos', 'avatars') AND auth.role() = 'authenticated');

-- Permitir visualização pública
CREATE POLICY "Public View Access" ON storage.objects
    FOR SELECT
    USING (bucket_id IN ('company-logos', 'avatars'));
