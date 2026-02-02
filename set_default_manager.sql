-- DEFINIR GESTOR COMO PADRÃO PARA NOVOS ACESSOS
-- Este script garante que qualquer pessoa que se cadastre no site (Signup) nasça como 'admin' (Gestor).
-- Operadores e outros cargos devem ser convidados ou alterados manualmente.

-- 1. Alterar o valor padrão da coluna na tabela (Segurança 1)
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'admin'::app_role;

-- 2. Atualizar ou Criar o Gatilho (Trigger) de cadastro (Segurança 2)
-- Esta função é executada automaticamente pelo Supabase Auth quando um usuário se cadastra.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    'admin'::app_role -- <--- FORÇA O PAPEL DE ADMIN (GESTOR)
  );
  
  -- Sincroniza metadata também para garantir sessão imediata correta
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(COALESCE(new.raw_user_meta_data, '{}'::jsonb), '{role}', '"admin"')
  WHERE id = new.id;
  
  RETURN new;
END;
$$;

-- Recriar o trigger para garantir que está ativo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. (Opcional) Promover usuários 'soltos' (sem equipe) para Admin
-- Caso alguém tenha se cadastrado logo antes de rodar este script
UPDATE public.profiles
SET role = 'admin'::app_role
WHERE role = 'operator' 
AND id NOT IN (SELECT linked_user_id FROM public.team_members WHERE linked_user_id IS NOT NULL);
