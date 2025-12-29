import { z } from "zod"

export const teamMemberSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    role: z.string().min(1, "Função é obrigatória"), // e.g. Operador, Ajudante, Supervisor
    status: z.enum(["Ativo", "Inativo"]).default("Ativo"),
})

export type TeamMemberSchema = z.infer<typeof teamMemberSchema>

export type TeamMember = TeamMemberSchema & {
    id: string
    user_id: string
    created_at: string
}
