import { z } from "zod"

export const planoDeFogoSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    projectId: z.string().min(1, "Obra é obrigatória").uuid("ID da Obra inválido"),
    description: z.string().optional(),
    status: z.enum(["Aberto", "Concluído"]).default("Aberto").optional(),
    finished_at: z.string().optional(),
})

export type PlanoDeFogoSchema = z.infer<typeof planoDeFogoSchema>

export type PlanoDeFogo = PlanoDeFogoSchema & {
    id: string
    created_at: string
    updated_at: string
    user_id: string
}
