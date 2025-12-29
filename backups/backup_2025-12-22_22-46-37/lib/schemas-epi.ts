import { z } from "zod"
import { unitSchema } from "@/lib/schemas-inventory"

export const epiSchema = z.object({
    name: z.string().min(1, "Nome do EPI é obrigatório"),
    ca: z.string().min(1, "C.A. (Certificado de Aprovação) é obrigatório"),
    projectId: z.string().min(1, "Obra é obrigatória"),
    unit: unitSchema,
    quantity: z.coerce.number().min(0, "Quantidade não pode ser negativa"),
    expirationDate: z.string().optional(), // YYYY-MM-DD
    size: z.string().optional(),
})

export type EPISchema = z.infer<typeof epiSchema>

export type EPI = EPISchema & {
    id: string
    user_id: string
    created_at: string
    projects?: {
        name: string
    }
}
