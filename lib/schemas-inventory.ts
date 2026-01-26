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
    model: z.preprocess((val) => val === "" ? null : val, z.string().nullable().optional()),
    supplier: z.preprocess((val) => val === "" ? null : val, z.string().nullable().optional()),
    entry_date: z.preprocess((val) => val === "" ? null : val, z.string().nullable().optional()),
    invoice_number: z.preprocess((val) => val === "" ? null : val, z.string().nullable().optional()),

    quantity: z.coerce.number().min(0, "Quantidade não pode ser negativa"),
    value: z.coerce.number().min(0, "Valor não pode ser negativo"),
    minStock: z.coerce.number().min(0).optional(),

    // EPI Specifics
    ca: z.string().optional(),
    expirationDate: z.preprocess((val) => val === "" ? null : val, z.string().nullable().optional()),
    size: z.string().optional(),
})

export type InventoryItemSchema = z.infer<typeof inventoryItemSchema>

export type InventoryItem = InventoryItemSchema & {
    id: string
    user_id: string
    created_at: string
    projects?: { name: string } | null
}

// [v2.3] Asset Schema (Patrimônio)
export const assetSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório"),
    purchase_date: z.string().optional(), // YYYY-MM-DD
    invoice_number: z.string().optional(),
    value: z.coerce.number().min(0).default(0),
    quantity: z.coerce.number().min(1).default(1),
    tag_number: z.string().optional(),
    project_id: z.string().optional(),
    description: z.string().optional(),
})

export type AssetSchema = z.infer<typeof assetSchema>

export type ProjectAsset = AssetSchema & {
    id: string
    user_id: string
    created_at: string
    projects?: { name: string } | null
}

export const stockMovementSchema = z.object({
    itemId: z.string().min(1, "Item é obrigatório"),
    targetProjectId: z.string().min(1, "Obra de destino é obrigatória"),
    quantity: z.coerce.number().positive("Quantidade deve ser positiva"),
})
