-- ULTIMATE RBAC RESET SCRIPT
-- Handles Policy Dependencies to avoid "cannot alter type" error.

BEGIN;

-- 1. DROP ALL DEPENDENT POLICIES FIRST
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Supervisors can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 2. RESET THE COLUMN AND TYPE
-- Temporarily convert to text to break the link to the Enum
ALTER TABLE public.profiles 
ALTER COLUMN role DROP DEFAULT,
ALTER COLUMN role TYPE text USING role::text;

-- 3. SANITIZE DATA (Fix invalid values like 'viewer')
UPDATE public.profiles 
SET role = 'operator' 
WHERE role NOT IN ('admin', 'supervisor', 'operator');

-- 4. Drop the old type completely
DROP TYPE IF EXISTS app_role;

-- Re-create the Enum type with correct values
CREATE TYPE app_role AS ENUM ('admin', 'supervisor', 'operator');

-- Convert the column back to the new Enum
ALTER TABLE public.profiles 
ALTER COLUMN role TYPE app_role USING role::app_role,
ALTER COLUMN role SET DEFAULT 'operator';

-- 3. RE-CREATE POLICIES CORRECTLY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can do everything on profiles"
ON public.profiles FOR ALL
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));

CREATE POLICY "Supervisors can view all profiles"
ON public.profiles FOR SELECT
USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'supervisor'));

CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

COMMIT;
