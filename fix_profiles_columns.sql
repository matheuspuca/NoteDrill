-- FORÇAR ADIÇÃO DE COLUNAS (Caso a tabela já exista sem elas)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_email text;

-- Recarregar cache do schema do Supabase (para sumir o erro PGRST204)
NOTIFY pgrst, 'reload config';
