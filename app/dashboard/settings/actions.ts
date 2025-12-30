"use server"

import { createClient } from "@/lib/supabase/server"
import { companySettingsSchema, profileSettingsSchema, CompanySettingsSchema, ProfileSettingsSchema } from "@/lib/schemas-settings"

export async function updateCompanySettings(data: CompanySettingsSchema & { logo_url: string | null }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Usuário não autenticado" }
    }

    const payload = {
        user_id: user.id,
        ...data,
        updated_at: new Date().toISOString()
    }

    try {
        const { error } = await supabase
            .from("company_settings")
            .upsert(payload, { onConflict: 'user_id' })

        if (error) {
            console.error("Server Action Error (Company):", error)
            return { error: error.message }
        }

        return { success: true }
    } catch (e: any) {
        return { error: e.message }
    }
}

export async function getCompanySettings() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()

    return data
}

export async function updateProfile(data: ProfileSettingsSchema & { avatar_url: string | null }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Usuário não autenticado" }
    }

    const updates = {
        id: user.id,
        email: user.email, // Garantir que o email seja salvo/atualizado para satisfazer constraint NOT NULL
        ...data,
        updated_at: new Date().toISOString(),
    }

    try {
        const { error } = await supabase
            .from("profiles")
            .upsert(updates)

        if (error) {
            console.error("Server Action Error (Profile):", error)
            return { error: error.message }
        }

        return { success: true }
    } catch (e: any) {
        return { error: e.message }
    }
}

export async function updatePassword(password: string) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: "Usuário não autenticado" }
    }

    const { error } = await supabase.auth.updateUser({
        password: password
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}
