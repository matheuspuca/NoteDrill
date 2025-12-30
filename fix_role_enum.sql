-- Fix for 'invalid input value for enum app_role'
-- This adds the missing values to the existing Enum type.

ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'supervisor';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'operator';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'admin';

-- Re-run the column addition just in case it failed partway
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role app_role DEFAULT 'operator';
