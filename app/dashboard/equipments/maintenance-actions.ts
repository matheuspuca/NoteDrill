"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { MaintenanceEventSchema, maintenanceEventSchema } from "@/lib/schemas-equipment"

export async function createMaintenanceEvent(data: MaintenanceEventSchema) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Sem permissão." }
    }

    const validation = maintenanceEventSchema.safeParse(data)
    if (!validation.success) {
        return { error: "Dados inválidos." }
    }

    try {
        const { error } = await supabase
            .from("maintenance_events")
            .insert({
                equipment_id: data.equipment_id,
                date: new Date(data.date as string).toISOString(), // Ensure ISO string
                type: data.type,
                status: data.status,
                hour_meter: data.hour_meter,
                cost: data.cost,
                description: data.description,
                user_id: user.id
            })

        if (error) throw error

        // Optional: Update equipment status if maintenance is active (IN_PROGRESS)
        if (data.status === "IN_PROGRESS" && (data.type === "CORRECTIVE" || data.type === "REVISION")) {
            await supabase
                .from("equipment")
                .update({ status: "Manutenção" })
                .eq("id", data.equipment_id)
        }

        revalidatePath("/dashboard/equipments")
        return { success: true }
    } catch (error) {
        console.error("Erro ao criar manutenção:", error)
        return { error: "Erro ao registrar manutenção." }
    }
}

export async function updateMaintenanceEvent(id: string, data: MaintenanceEventSchema) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Sem permissão." }
    }

    const validation = maintenanceEventSchema.safeParse(data)
    if (!validation.success) {
        return { error: "Dados inválidos." }
    }

    try {
        const { error } = await supabase
            .from("maintenance_events")
            .update({
                date: new Date(data.date as string).toISOString(),
                type: data.type,
                status: data.status,
                hour_meter: data.hour_meter,
                cost: data.cost,
                description: data.description,
            })
            .eq("id", id)
            .eq("user_id", user.id)

        if (error) throw error

        // If maintenance is completed, set equipment back to Operational (optional, complex logic might be needed)
        if (data.status === "COMPLETED") {
            // Check if there are other active maintenances before setting to Operational?
            // For simplify, we assume manual update back to Operational via Equipment Form if needed, 
            // OR we just set it here. Let's be conservative and NOT auto-set to Operational to avoid overriding other states unintentionally.
            // But the prompt said: "Ao finalizar a manutenção, o equipamento volta para Disponível" (Operational).

            // Check if there are ANY other IN_PROGRESS maintenance events for this equipment
            const { count } = await supabase
                .from("maintenance_events")
                .select("*", { count: 'exact', head: true })
                .eq("equipment_id", data.equipment_id)
                .eq("status", "IN_PROGRESS")
                .neq("id", id) // Exclude current one provided it was just updated (though update happens first)

            // Actually database update happened above. So we check if ANY "IN_PROGRESS" exists.
            // If count is 0, we can set to Operational.

            const { count: remainingActive } = await supabase
                .from("maintenance_events")
                .select("*", { count: 'exact', head: true })
                .eq("equipment_id", data.equipment_id)
                .eq("status", "IN_PROGRESS")

            if (remainingActive === 0) {
                await supabase
                    .from("equipment")
                    .update({ status: "Operacional" })
                    .eq("id", data.equipment_id)
            }
        }

        revalidatePath("/dashboard/equipments")
        return { success: true }
    } catch (error) {
        console.error("Erro ao atualizar manutenção:", error)
        return { error: "Erro ao atualizar registro." }
    }
}

export async function deleteMaintenanceEvent(id: string) {
    const supabase = createClient()

    try {
        const { error } = await supabase
            .from("maintenance_events")
            .delete()
            .eq("id", id)

        if (error) throw error

        revalidatePath("/dashboard/equipments")
        return { success: true }
    } catch (error) {
        console.error("Erro ao excluir manutenção:", error)
        revalidatePath("/dashboard/equipments") // Revalidate anyway
        return { error: "Erro ao excluir registro." }
    }
}

export async function getMaintenanceEvents(equipmentId: string) {
    const supabase = createClient()

    const { data } = await supabase
        .from("maintenance_events")
        .select("*")
        .eq("equipment_id", equipmentId)
        .order("date", { ascending: false })

    return data || []
}
