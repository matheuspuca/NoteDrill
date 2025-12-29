import { z } from "zod"

export const companySettingsSchema = z.object({
    company_name: z.string().min(2, "Nome da empresa deve ter pelo menos 2 caracteres"),
    cnpj: z.string().min(14, "CNPJ inválido").optional().or(z.literal("")),
    address: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    phone: z.string().optional(),
    website: z.string().url("URL inválida").optional().or(z.literal("")),
})

export type CompanySettingsSchema = z.infer<typeof companySettingsSchema>

export const profileSettingsSchema = z.object({
    full_name: z.string().min(2, "Nome completo deve ter pelo menos 2 caracteres"),
    username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres").optional(),
    website: z.string().url("URL inválida").optional().or(z.literal("")),
})

export type ProfileSettingsSchema = z.infer<typeof profileSettingsSchema>
