import { z } from "zod"

export const projectSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    address: z.string().min(1, "Endereço é obrigatório"),
    city: z.string().min(1, "Cidade é obrigatória"),
    zip_code: z.string().optional(),
    responsible_engineer: z.string().optional(),
    responsible_phone: z.string().optional(),
    status: z.enum(["Produção", "Planejamento", "Parada", "Concluída"], {
        required_error: "Status é obrigatório",
    }),
    volume_m3: z.coerce.number().min(0, "Volume deve ser positivo").optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    contract_number: z.string().optional(),
})

export type ProjectSchema = z.infer<typeof projectSchema>

export type Project = ProjectSchema & {
    id: string
    user_id: string
    created_at: string
    updated_at?: string
}
