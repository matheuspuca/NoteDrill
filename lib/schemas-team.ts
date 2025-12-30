import { z } from "zod"

export const teamMemberSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    role: z.string().min(1, "Função é obrigatória"),
    status: z.enum(["Ativo", "Férias", "Atestado", "Inativo"]).default("Ativo"),

    // HR Fields
    birthDate: z.string().optional(),
    admissionDate: z.string().optional(),
    asoDate: z.string().optional(),

    // System Access
    createSystemUser: z.boolean().default(false).optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    password: z.string().min(6, "Senha deve ter 6 caracteres").optional().or(z.literal("")),
    systemRole: z.enum(["admin", "supervisor", "operator"]).optional(),
}).refine((data) => {
    if (data.createSystemUser) {
        return !!data.email && !!data.password && !!data.systemRole
    }
    return true
}, {
    message: "Email, Senha e Nível de Acesso são obrigatórios para criar usuário",
    path: ["createSystemUser"] // Attach error to checkbox or generic
})

export type TeamMemberSchema = z.infer<typeof teamMemberSchema>

export type TeamMember = TeamMemberSchema & {
    id: string
    user_id: string
    linked_user_id?: string
    email?: string
    created_at: string
}
