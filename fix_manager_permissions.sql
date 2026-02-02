-- CORREÇÃO DE PERMISSÕES DE GESTOR (VERSÃO CORRIGIDA)
-- Roles válidas no banco: 'admin', 'supervisor', 'operator'
-- 'engineer' NÃO existe no banco, deve ser mapeado para 'admin' ou 'supervisor'

-- 1. Atualizar roles na tabela profiles baseada na tabela team_members

-- Supervisor/Encarregado -> supervisor (Role válida)
UPDATE public.profiles
SET role = 'supervisor'::app_role
FROM public.team_members
WHERE public.profiles.id = public.team_members.linked_user_id
AND public.team_members.role IN ('Supervisor', 'Encarregado');

-- Admin/Engenheiro/Outros -> admin (Role válida)
-- Mapeia qualquer um que NÃO seja operacional/liderança média para admin
UPDATE public.profiles
SET role = 'admin'::app_role
FROM public.team_members
WHERE public.profiles.id = public.team_members.linked_user_id
AND public.team_members.role NOT IN (
    'Operador', 
    'Ajudante', 
    'Motorista', 
    'Auxiliar', 
    'Mecânico', 
    'Eletricista', 
    'Supervisor', 
    'Encarregado'
);

-- 2. Fallback por Email (Segurança para contas sem vínculo direto ainda)
-- Garante que emails administrativos sejam admins
UPDATE public.profiles
SET role = 'admin'::app_role
WHERE (
    email ILIKE '%admin%' OR 
    email ILIKE '%gestor%' OR 
    email ILIKE '%eng%' OR 
    email ILIKE '%notedrill%'
)
AND role = 'operator';

-- 3. Atualizar metadados do Supabase Auth
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', to_jsonb(public.profiles.role))
FROM public.profiles
WHERE auth.users.id = public.profiles.id
AND public.profiles.role != 'operator';

-- 4. Verificação final
SELECT email, role FROM public.profiles WHERE role != 'operator';
