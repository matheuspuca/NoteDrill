/* === SETTINGS & PROFILE SETUP === */

/* 1. COMPANY SETTINGS TABLE */
CREATE TABLE IF NOT EXISTS public.company_settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE, /* One company profile per user (or generic if shared) */
    
    company_name text,
    cnpj text,
    address text,
    email text,
    phone text,
    logo_url text, -- URL to Supabase Storage
    website text
);

/* 2. RLS POLICIES FOR COMPANY SETTINGS */
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own company settings" ON public.company_settings;
CREATE POLICY "Users can view their own company settings" ON public.company_settings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own company settings" ON public.company_settings;
CREATE POLICY "Users can update their own company settings" ON public.company_settings
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own company settings" ON public.company_settings;
CREATE POLICY "Users can insert their own company settings" ON public.company_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

/* 3. ENSURE PROFILES TABLE (If not already present from Auth starter) */
-- Checks if public.profiles exists, if not creates it.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at timestamp with time zone,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  website text,
  constraint username_length check (char_length(username) >= 3)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

/* 4. STORAGE BUCKET POLICIES (Note: Buckets must be created in Dashboard usually, but we can set policies) */
-- We assume buckets 'avatars' and 'company-logos' will be used.
-- The user must create 'company-logos' bucket in Supabase Dashboard -> Storage if it doesn't exist.

-- Policy for 'company-logos' (Allow public read, auth upload)
-- RUN THIS IN SQL EDITOR MANUALLY IF BUCKET CREATION VIA SQL IS BLOCKED
-- INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true) ON CONFLICT DO NOTHING;

/* Refresh Cache */
NOTIFY pgrst, 'reload schema';
