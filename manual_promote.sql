-- SCRIPT DE EMERGÊNCIA - PROMOÇÃO MANUAL
-- Substitua 'SEU_EMAIL_AQUI' pelo email do usuário que está com problemas.

DO $$
DECLARE
    target_email TEXT := 'comercial@minerattum.com'; -- <--- COLOQUE O EMAIL AQUI
BEGIN
    -- 1. Atualizar Profile para ADMIN
    UPDATE public.profiles
    SET role = 'admin'::app_role
    WHERE email = target_email;

    -- 2. Atualizar Metadados de Autenticação (Para sessão)
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', '"admin"')
    WHERE email = target_email;
    
END $$;

-- Verificação (Vai mostrar se deu certo após rodar)
SELECT email, role FROM public.profiles WHERE email = 'comercial@minerattum.com';
