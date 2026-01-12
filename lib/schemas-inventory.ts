import { z } from "zod"

export const unitSchema = z.enum(["Unidade", "Litros", "Metros", "Kg", "Caixa", "Pacote", "Tambor"])

export const itemTypeSchema = z.enum(["Material", "Ferramenta", "EPI", "Combustível"])

export const inventoryItemSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    type: itemTypeSchema.default("Material"),
    projectId: z.string().min(1, "Obra é obrigatória"),
    unit: unitSchema,
    brand: z.string().optional(),

    // New Fields
    model: z.string().nullable().optional(),
    supplier: z.string().nullable().optional(),
    entry_date: z.string().nullable().optional(),
    invoice_number: z.string().nullable().optional(),

    quantity: z.coerce.number().min(0, "Quantidade não pode ser negativa"),
    value: z.coerce.number().min(0, "Valor não pode ser negativo"),
    minStock: z.coerce.number().min(0).optional(),

    // EPI Specifics (Optional in this base schema, but enforced in UI/Form logic)
    ca: z.string().optional(),
    expirationDate: z.string().optional(),
    size: z.string().optional(),
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
