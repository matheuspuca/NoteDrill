import { z } from "zod"

export const teamMemberSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    role: z.string().min(1, "Função é obrigatória"),
    status: z.enum(["Ativo", "Férias", "Atestado", "Inativo"]).default("Ativo"),

    // HR Fields
    birthDate: z.string().optional(), // ISO String YYYY-MM-DD
    admissionDate: z.string().optional(),
    asoDate: z.string().optional(), // Vencimento ASO
})

export type TeamMemberSchema = z.infer<typeof teamMemberSchema>

export type TeamMember = TeamMemberSchema & {
    id: string
    user_id: string
    created_at: string
}
