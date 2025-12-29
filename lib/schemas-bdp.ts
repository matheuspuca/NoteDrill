import { z } from "zod"

// --- Aux Schemas ---

export const serviceTypeSchema = z.enum([
    "Perfuração Pré Corte",
    "Perfuração Auxiliar",
    "Perfuração Bancada",
    "Perfuração Regularização",
    "Mataco",
    "Perfuração Outros"
])

export const holeInputSchema = z.object({
    id: z.string().optional(),
    holeNumber: z.coerce.number().min(1, "# Inválido"),

    // Location
    meshPoint: z.string().optional(), // Malha (Name/ID)
    latitude: z.string().optional(),
    longitude: z.string().optional(),

    // Params (Simplified)
    depth: z.coerce.number().min(0, "Profundidade inválida"), // Actual Depth (Altura Perfurada)
    subDrilling: z.coerce.number().optional(), // Subfuração

    // Legacy / Calculation helpers
    targetDepth: z.coerce.number().optional(),
})

export const occurrenceTypeSchema = z.enum([
    "Lanche/almoço/jantar",
    "Abastecimento diesel",
    "Abastecimento água",
    "Mecânica",
    "Aguardando limpeza",
    "Locomoção de equipamento",
    "Sem frente de serviço",
    "Marcação topográfica",
    "Falta de iluminação",
    "Chuva forte",
    "Detonação",
    "DDS",
    "Transporte de pessoal",
    "Falta de operador/ajudante",
    "Falta de material de desgaste",
    "Falta de peça",
    "Inspeção de equipamento",
    "Carga e transporte de material detonado",
    "Falta abastecimento cliente",
    "Outros"
])

export const occurrenceEntrySchema = z.object({
    id: z.string().optional(),
    type: occurrenceTypeSchema,
    timeStart: z.string().min(1, "Início obrigatório"), // HH:mm
    timeEnd: z.string().min(1, "Fim obrigatório"),     // HH:mm
    description: z.string().optional(),
})

export const supplyTypeSchema = z.enum([
    "Diesel (L)",
    "Óleo 220 (L)",
    "Óleo 90 (L)",
    "Óleo 68 (L)",
    "Óleo 15w40 (L)",
    "Graxa Comum (kg)",
    "Graxa Grafitada (kg)",
    "Outros"
])
// Mapping for keys if needed, but we'll store array of objects now
export const supplyEntrySchema = z.object({
    id: z.string().optional(),
    type: supplyTypeSchema,
    quantity: z.coerce.number().min(0, "Qtd inválida"),
})

// --- Main Schema ---

export const bdpSchema = z.object({
    // Header Data (Relations)
    date: z.string().min(1, "Data é obrigatória"),
    shift: z.enum(["Diurno", "Noturno"], { required_error: "Turno é obrigatório" }),

    // Relations (UUIDs)
    projectId: z.string().min(1, "Selecione a obra"),
    operatorId: z.string().min(1, "Selecione o operador"), // From Team table
    helperId: z.string().optional(), // Helper from Team table

    drillId: z.string().min(1, "Selecione a perfuratriz"), // From Equipment table
    compressorId: z.string().optional(), // From Equipment table

    // Counters
    hourmeterStart: z.coerce.number().min(0),
    hourmeterEnd: z.coerce.number().min(0),
    startTime: z.string().min(1, "Início obrigatório"), // HH:mm
    endTime: z.string().min(1, "Fim obrigatório"), // HH:mm

    // General Parameters (Legacy / Root defaults - Optional now as they are per service)
    holeDiameter: z.coerce.number().optional(),
    angle: z.coerce.number().optional(),
    azimuth: z.coerce.number().optional(),

    // Geology (Header Level)
    materialDescription: z.string().optional(),
    lithologyProfile: z.string().optional(),
    penetrationTime: z.string().optional(), // e.g. "20m/h"

    // Services (Grouping)
    // We replace 'holes' with a structured 'production' array or modify holes to be nested?
    // User wants: Service Type -> Quantity -> Holes Input
    // Let's use a specific 'services' array
    services: z.array(z.object({
        serviceType: serviceTypeSchema,

        // Header Params for the Service Group
        meshLength: z.coerce.number().optional(), // Afastamento
        meshWidth: z.coerce.number().optional(),  // Espaçamento
        diameter: z.coerce.number().optional(),
        angle: z.coerce.number().optional(),
        azimuth: z.coerce.number().optional(),

        holeCount: z.coerce.number().min(0),
        holes: z.array(holeInputSchema)
    })).optional(),

    // Legacy (kept for compatibility or flattened on submit)
    holes: z.array(holeInputSchema).optional(),

    // Stats (calculated)
    totalMeters: z.coerce.number().optional(),
    averageHeight: z.coerce.number().optional(),
    totalHours: z.coerce.number().optional(),
})

export type BDPSchema = z.infer<typeof bdpSchema>

export type BDP = BDPSchema & {
    id: string
    created_at: string
    user_id: string
    // Expanded relations types for UI display if joined
    projects?: { name: string }
    operator?: { name: string }
    drill?: { name: string } // or code
}
