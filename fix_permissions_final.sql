-- 1. GARANTIR TABELA
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

-- 2. HABILITAR RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- 3. GARANTIR GRANTS (Permissões básicas de acesso à tabela)
-- Isso muitas vezes é a causa do 403 mesmo com Policies corretas
GRANT ALL ON public.company_settings TO postgres;
GRANT ALL ON public.company_settings TO service_role;
GRANT ALL ON public.company_settings TO authenticated;

-- 4. LIMPAR POLICIES ANTIGAS
DROP POLICY IF EXISTS "Users can view their own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can update their own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can insert their own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Enable all actions for users based on user_id" ON public.company_settings;

-- 5. CRIAR POLICY UNIFICADA
-- Permite SELECT, INSERT, UPDATE, DELETE apenas se o user_id bater com o auth.uid()
CREATE POLICY "Enable all actions for users based on user_id" ON public.company_settings
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. CRIAR BUCKETS (Por precaução, caso não existam)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true) 
ON CONFLICT (id) DO NOTHING;

-- Grants para Storage
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Policies para Storage (Logos)
DROP POLICY IF EXISTS "Logos Public Access" ON storage.objects;
CREATE POLICY "Logos Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'company-logos');

DROP POLICY IF EXISTS "Logos Auth Upload" ON storage.objects;
CREATE POLICY "Logos Auth Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company-logos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Logos Auth Update" ON storage.objects;
CREATE POLICY "Logos Auth Update" ON storage.objects FOR UPDATE USING (bucket_id = 'company-logos' AND auth.role() = 'authenticated');
