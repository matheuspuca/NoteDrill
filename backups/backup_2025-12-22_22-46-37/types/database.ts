// Enums para garantir consistência com o banco (PostgreSQL Enum)
export type AppRole = 'admin' | 'engineer' | 'operator' | 'viewer';

// Interface que espelha a tabela 'public.profiles'
export interface UserProfile {
    id: string; // UUID
    email: string;
    full_name: string | null;
    role: AppRole;
    crea_registration?: string | null; // Opcional, conforme SQL
    company_name?: string | null;      // Opcional, conforme SQL
    created_at: string; // ISO String retornada pelo JSON do Supabase
    updated_at: string;
}

// Tipo auxiliar para resposta do Supabase ao buscar o perfil
export interface ProfileResponse {
    data: UserProfile | null;
    error: Error | null;
}
