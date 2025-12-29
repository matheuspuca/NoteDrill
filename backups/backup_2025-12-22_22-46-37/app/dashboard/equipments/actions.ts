"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { equipmentSchema, EquipmentSchema } from "@/lib/schemas-equipment"

export async function createEquipment(data: EquipmentSchema) {
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
        .insert({
            ...validatedData,
            user_id: user.id
        })

    if (error) {
        console.error("Erro ao criar equipamento:", error)
        return { error: "Erro ao criar equipamento" }
    }

    revalidatePath("/dashboard/equipments")
    return { success: true }
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
