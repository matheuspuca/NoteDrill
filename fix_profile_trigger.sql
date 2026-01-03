-- FIX: Ensure Profile Creation on Signup (Trigger)
-- Run this in Supabase SQL Editor to fix missing profiles for new users.

-- 1. Create Function to Handle New User
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'admin' -- Default role, can be changed
  );
  return new;
end;
$$;

-- 2. Create Trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Policy for Insert (just in case client needs it, though trigger is better)
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);
