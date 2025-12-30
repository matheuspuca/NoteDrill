-- Create an Enum for Roles (safer than text)
DO $$ BEGIN
    CREATE TYPE app_role AS ENUM ('admin', 'supervisor', 'operator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update PROFILES table to include role
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role app_role DEFAULT 'operator';

-- Update TEAM_MEMBERS to link to Auth Users
ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS linked_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS email TEXT;

-- Enable RLS on Profiles (if not already)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- POLICIES --

-- Admin can do everything
CREATE POLICY "Admins can do everything on profiles"
ON public.profiles
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- Supervisors can view all profiles
CREATE POLICY "Supervisors can view all profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'supervisor'
  )
);

-- Users can read own profile
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);
