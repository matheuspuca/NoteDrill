import { z } from "zod"

export const unitSchema = z.enum(["Unidade", "Litros", "Metros", "Kg", "Caixa", "Pacote", "Tambor"])

export const inventoryItemSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    projectId: z.string().min(1, "Obra é obrigatória"),
    unit: unitSchema,
    brand: z.string().optional(),
    quantity: z.coerce.number().min(0, "Quantidade não pode ser negativa"),
    value: z.coerce.number().min(0, "Valor não pode ser negativo"),
    minStock: z.coerce.number().min(0).optional(),
})

export type InventoryItemSchema = z.infer<typeof inventoryItemSchema>

export type InventoryItem = InventoryItemSchema & {
    id: string
    user_id: string
    created_at: string
    projects?: {
        name: string
    }
}

export const stockMovementSchema = z.object({
    itemId: z.string().min(1, "Item é obrigatório"),
    targetProjectId: z.string().min(1, "Obra de destino é obrigatória"),
    quantity: z.coerce.number().positive("Quantidade deve ser positiva"),
})
