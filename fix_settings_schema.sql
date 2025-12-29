-- 1. COMPANY SETTINGS TABLE
-- Ensures the table exists with all necessary columns
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
    logo_url text, -- Stores the public URL from Supabase Storage
    website text
);

-- 2. RLS POLICIES FOR COMPANY SETTINGS
-- Enables security and allows users to manage ONLY their own data
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts/duplicates
DROP POLICY IF EXISTS "Users can view their own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can update their own company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can insert their own company settings" ON public.company_settings;

-- Re-create policies
CREATE POLICY "Users can view their own company settings" ON public.company_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own company settings" ON public.company_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company settings" ON public.company_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. STORAGE BUCKETS
-- Attempts to create the buckets. Note: In some Supabase versions, this must be done via Dashboard.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. STORAGE POLICIES
-- Allows public viewing of images, but only authenticated upload/update

-- Company Logos Policies
DROP POLICY IF EXISTS "Public Access Logos" ON storage.objects;
CREATE POLICY "Public Access Logos" ON storage.objects FOR SELECT USING (bucket_id = 'company-logos');

DROP POLICY IF EXISTS "Auth Upload Logos" ON storage.objects;
CREATE POLICY "Auth Upload Logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company-logos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth Update Logos" ON storage.objects;
CREATE POLICY "Auth Update Logos" ON storage.objects FOR UPDATE USING (bucket_id = 'company-logos' AND auth.role() = 'authenticated');

-- Avatars Policies
DROP POLICY IF EXISTS "Public Access Avatars" ON storage.objects;
CREATE POLICY "Public Access Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Auth Upload Avatars" ON storage.objects;
CREATE POLICY "Auth Upload Avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Auth Update Avatars" ON storage.objects;
CREATE POLICY "Auth Update Avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');
