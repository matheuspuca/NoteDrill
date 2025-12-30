-- FIX: Break Infinite Recursion in RLS Policies
-- We use SECURITY DEFINER functions to safely check roles without triggering RLS loops.

-- 1. Create Helper Functions (Bypass RLS)
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = user_id);
END;
$$;

-- 2. Drop Existing Policies
DROP POLICY IF EXISTS "Admins can do everything on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Supervisors can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 3. Re-create Policies (Clean & Recursive-Free)

-- Admin Policy: Can do everything if their own role is 'admin'
CREATE POLICY "Admins can do everything on profiles"
ON public.profiles
FOR ALL
USING (
  public.get_user_role(auth.uid()) = 'admin'
);

-- Supervisor Policy: Can view everything if their role is 'supervisor'
CREATE POLICY "Supervisors can view all profiles"
ON public.profiles
FOR SELECT
USING (
  public.get_user_role(auth.uid()) = 'supervisor'
);

-- Basic User Policy: Can read OWN profile (Always allowed for self)
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id
);

-- Basic User Policy: Can update OWN profile
-- Added WITH CHECK to ensure they can't change their own ID
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id
);
