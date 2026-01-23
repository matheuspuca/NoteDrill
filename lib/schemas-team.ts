import { z } from "zod"

export const teamMemberSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    role: z.string().min(1, "Função é obrigatória"),
    status: z.enum(["Ativo", "Férias", "Atestado", "Inativo"]).default("Ativo"),

    // HR Fields
    birthDate: z.string().optional(),
    admissionDate: z.string().optional(),
    asoDate: z.string().optional(),

    // System Props
    registrationNumber: z.number().optional(), // Auto-generated

    // System Access
    createSystemUser: z.boolean().default(false).optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    systemRole: z.string().optional(),
    projectId: z.string().uuid().optional(),

}).refine((data) => {
    if (data.createSystemUser) {
        // Invite Flow requires Email and Role
        return !!data.email && !!data.systemRole
    }
    return true
}, {
    message: "Email e Nível de Acesso são obrigatórios para enviar convite",
    path: ["createSystemUser"]
})

export type TeamMemberSchema = z.infer<typeof teamMemberSchema>

export type TeamMember = TeamMemberSchema & {
    id: string
    user_id: string
    linked_user_id?: string
    email?: string
    registrationNumber?: number
    created_at: string
}
