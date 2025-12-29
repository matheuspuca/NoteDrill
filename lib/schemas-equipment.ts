import { z } from "zod"

// Enum for Equipment Types
export const equipmentTypeSchema = z.enum(["Hidráulica", "Pneumática", "Compressor", "Veículo", "Outros"])

// Enum for Status
export const equipmentStatusSchema = z.enum(["Operacional", "Manutenção", "Indisponível"])

// Schema for Compressor Details (nested)
export const compressorDetailsSchema = z.object({
    brand: z.string().optional(),
    model: z.string().optional(),
    year: z.coerce.number().optional(),
    serialNumber: z.string().optional(),
    hourmeter: z.coerce.number().optional(),
})

// Main Equipment Schema
export const equipmentSchema = z.object({
    internalCode: z.string().min(1, "Código é obrigatório"),
    name: z.string().min(1, "Nome é obrigatório"),
    type: equipmentTypeSchema,
    model: z.string().min(1, "Modelo é obrigatório"),
    manufacturer: z.string().min(1, "Fabricante é obrigatório"),
    year: z.coerce.number().min(1900, "Ano inválido"),
    chassis: z.string().optional(),

    // Status & Maintenance
    status: equipmentStatusSchema,
    hourmeter: z.coerce.number().min(0),
    maintenanceInterval: z.coerce.number().min(0, "Intervalo deve ser positivo"), // Hours

    // Nested Compressor Details (Only for Pneumatic)
    compressorDetails: compressorDetailsSchema.optional(),
})

export type EquipmentSchema = z.infer<typeof equipmentSchema>

export type Equipment = EquipmentSchema & {
    id: string
    user_id: string
    created_at: string
}
