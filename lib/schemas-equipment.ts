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

    // [v2.2] Asset Management
    ownership_type: z.enum(["OWNED", "RENTED"]).default("OWNED"),
    rental_company_name: z.string().optional(),
    rental_cost_monthly: z.coerce.number().min(0).optional(),
    depreciation_cost_monthly: z.coerce.number().min(0).optional(),

    // Nested Compressor Details (Only for Pneumatic)
    compressorDetails: compressorDetailsSchema.optional(),
}).refine((data) => {
    if (data.ownership_type === "RENTED") {
        return !!data.rental_company_name && data.rental_cost_monthly !== undefined
    }
    return true
}, {
    message: "Nome da locadora e valor do aluguel são obrigatórios para equipamentos alugados",
    path: ["rental_company_name"],
}).refine((data) => {
    if (data.ownership_type === "OWNED") {
        return data.depreciation_cost_monthly !== undefined
    }
    return true
}, {
    message: "Custo de depreciação mensal é obrigatório para equipamentos próprios",
    path: ["depreciation_cost_monthly"],
})

export type EquipmentSchema = z.infer<typeof equipmentSchema>

export type Equipment = EquipmentSchema & {
    id: string
    user_id: string
    created_at: string
}

// [v2.2] Maintenance Schema
export const maintenanceTypeSchema = z.enum(["REVISION", "PREVENTIVE", "CORRECTIVE"])
export const maintenanceStatusSchema = z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED"])

export const maintenanceEventSchema = z.object({
    id: z.string().optional(),
    equipment_id: z.string(),
    date: z.string().or(z.date()),
    type: maintenanceTypeSchema,
    status: maintenanceStatusSchema.default("SCHEDULED"),
    hour_meter: z.coerce.number().min(0, "Horímetro deve ser positivo"),
    cost: z.coerce.number().min(0).default(0),
    description: z.string().optional(),
})

export type MaintenanceEventSchema = z.infer<typeof maintenanceEventSchema>

export type MaintenanceEvent = MaintenanceEventSchema & {
    id: string
    created_at: string
    user_id: string
}
