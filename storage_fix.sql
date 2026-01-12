-- Enable Storage if not already enabled (usually enabled by default)

-- 1. Create Buckets (public)
insert into storage.buckets (id, name, public)
values ('company-logos', 'company-logos', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- 2. Drop existing policies to avoid conflicts (optional, be careful in prod)
drop policy if exists "Logos Public Access" on storage.objects;
drop policy if exists "Logos Auth Upload" on storage.objects;
drop policy if exists "Logos Auth Update" on storage.objects;
drop policy if exists "Avatars Public Access" on storage.objects;
drop policy if exists "Avatars Auth Upload" on storage.objects;
drop policy if exists "Avatars Auth Update" on storage.objects;

-- 3. Policies for company-logos
create policy "Logos Public Access"
  on storage.objects for select
  using ( bucket_id = 'company-logos' );

create policy "Logos Auth Upload"
  on storage.objects for insert
  with check ( bucket_id = 'company-logos' and auth.role() = 'authenticated' );

create policy "Logos Auth Update"
  on storage.objects for update
  using ( bucket_id = 'company-logos' and auth.role() = 'authenticated' );

-- 4. Policies for avatars
create policy "Avatars Public Access"
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Avatars Auth Upload"
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

create policy "Avatars Auth Update"
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- 5. Ensure Database Tables have correct columns
-- Add logo_url to company_settings if missing
alter table public.company_settings 
add column if not exists logo_url text;

-- Add avatar_url to profiles if missing
alter table public.profiles 
add column if not exists avatar_url text;
