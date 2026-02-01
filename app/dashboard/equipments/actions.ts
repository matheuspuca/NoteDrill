"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { equipmentSchema, EquipmentSchema } from "@/lib/schemas-equipment"
import { checkUsageLimits } from "@/lib/subscription-utils"

export async function createEquipment(data: EquipmentSchema) {
    try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: "Usuário não autenticado" }
        }

        const limitCheck = await checkUsageLimits(user.id, 'equipments')
        if (!limitCheck.allowed) {
            return { error: limitCheck.reason }
        }

        const parsed = equipmentSchema.safeParse(data)

        if (!parsed.success) {
            const errorMessages = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ')
            return { error: `Dados inválidos: ${errorMessages}` }
        }

        const { data: validatedData } = parsed

        console.log("Saving equipment data:", JSON.stringify(validatedData, null, 2)) // Debug log

        const { data: insertedData, error } = await supabase
            .from("equipment")
            .insert({
                ...validatedData,
                user_id: user.id
            })
            .select() // Add select to return the inserted data for verification

        if (error) {
            console.error("Supabase Insert Error:", JSON.stringify(error, null, 2))
            return { error: `Erro do Banco de Dados: ${error.message} (${error.code})` }
        }

        console.log("Equipment saved successfully:", insertedData)

        revalidatePath("/dashboard/equipments")
        revalidatePath("/dashboard")
        return { success: true }
    } catch (e: any) {
        console.error("Server Action Error:", e)
        return { error: "Erro interno." }
    }
}

export async function updateEquipment(id: string, data: EquipmentSchema) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Usuário não autenticado" }
    }

    const { success, data: validatedData } = equipmentSchema.safeParse(data)

    if (!success) {
        return { error: "Dados inválidos" }
    }

    const { error } = await supabase
        .from("equipment")
        .update({
            ...validatedData
        })
        .eq("id", id)

    if (error) {
        console.error("Erro ao atualizar equipamento:", error)
        return { error: "Erro ao atualizar equipamento" }
    }

    revalidatePath("/dashboard/equipments")
    return { success: true }
}

export async function deleteEquipment(id: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Usuário não autenticado" }
    }

    const { error } = await supabase
        .from("equipment")
        .delete()
        .eq("id", id)

    if (error) {
        return { error: "Erro ao excluir equipamento" }
    }

    revalidatePath("/dashboard/equipments")
    return { success: true }
}
