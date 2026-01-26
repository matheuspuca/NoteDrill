"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { assetSchema, AssetSchema } from "@/lib/schemas-inventory"

export async function createAsset(data: AssetSchema) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Sem permissão." }

    const validation = assetSchema.safeParse(data)
    if (!validation.success) return { error: "Dados inválidos." }

    // Sanitize dates
    const payload = {
        ...data,
        purchase_date: data.purchase_date || null,
        project_id: data.project_id || null, // Optional
        user_id: user.id
    }

    const { error } = await supabase.from("project_assets").insert(payload)

    if (error) {
        console.error("Create Asset Error:", error)
        return { error: "Erro ao criar patrimônio." }
    }

    revalidatePath("/dashboard/inventory")
    return { success: true }
}

export async function updateAsset(id: string, data: AssetSchema) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Sem permissão." }

    const validation = assetSchema.safeParse(data)
    if (!validation.success) return { error: "Dados inválidos." }

    const payload = {
        ...data,
        purchase_date: data.purchase_date || null,
        project_id: data.project_id || null,
    }

    const { error } = await supabase.from("project_assets").update(payload).eq("id", id)

    if (error) {
        console.error("Update Asset Error:", error)
        return { error: "Erro ao atualizar patrimônio." }
    }

    revalidatePath("/dashboard/inventory")
    return { success: true }
}

export async function deleteAsset(id: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Sem permissão." }

    const { error } = await supabase.from("project_assets").delete().eq("id", id)

    if (error) {
        console.error("Delete Asset Error:", error)
        return { error: "Erro ao excluir patrimônio." }
    }

    revalidatePath("/dashboard/inventory")
    return { success: true }
}
