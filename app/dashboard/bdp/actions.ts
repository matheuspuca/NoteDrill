"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { BDPSchema } from "@/lib/schemas-bdp"

export async function createBDP(data: BDPSchema) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Usuário não autenticado" }
    }

    try {
        // Exclude 'services' array as it's not in the DB schema
        const { services, ...rest } = data

        // Manual mapping camelCase -> snake_case
        const dbPayload = {
            date: rest.date,
            shift: rest.shift,
            project_id: rest.projectId,
            operator_id: rest.operatorId,
            helper_id: rest.helperId,
            drill_id: rest.drillId,
            compressor_id: rest.compressorId,
            hourmeter_start: rest.hourmeterStart,
            hourmeter_end: rest.hourmeterEnd,
            start_time: rest.startTime,
            end_time: rest.endTime,
            material_description: rest.materialDescription,
            rock_status: rest.rockStatus,
            rock_status_reason: rest.rockStatusReason,
            lithology_profile: rest.lithologyProfile,
            total_meters: rest.totalMeters,
            average_height: rest.averageHeight,
            total_hours: rest.totalHours,

            // JSONB / Array fields
            holes: rest.holes,
            occurrences: rest.occurrences,
            supplies: rest.supplies,

            user_id: user.id,
            status: 'PENDENTE'
        }

        const { error } = await supabase
            .from("bdp_reports")
            .insert(dbPayload)

        if (error) {
            console.error("Supabase Insert Error:", error)
            return { error: `Erro ao criar boletim: ${error.message}` }
        }

        // --- AUTOMATIC STOCK DEDUCTION for SUPPLIES ---
        if (data.supplies && data.supplies.length > 0) {
            // We iterate asynchronously; for production usage consider a Postgres Function (RPC) for atomicity.
            for (const supply of data.supplies) {
                if (!supply.quantity || supply.quantity <= 0) continue

                // Try to find the item in inventory by name
                // Strategy: Exact match on type OR fuzzy match excluding unit
                // e.g. "Diesel (L)" -> try "Diesel (L)" then "Diesel"

                // 1. Try Exact Match
                let { data: item } = await supabase
                    .from("inventory_items")
                    .select("id, quantity, name")
                    .eq("user_id", user.id) // Ensure robust RLS context
                    .ilike("name", supply.type)
                    .maybeSingle()

                // 2. If not found, try fuzzy (remove content in parens)
                if (!item) {
                    const simplifiedName = supply.type.split("(")[0].trim()
                    const { data: fuzzyItem } = await supabase
                        .from("inventory_items")
                        .select("id, quantity, name")
                        .eq("user_id", user.id)
                        .ilike("name", `${simplifiedName}%`)
                        .maybeSingle()

                    item = fuzzyItem
                }

                if (item) {
                    const currentQty = Number(item.quantity) || 0
                    const newQty = currentQty - Number(supply.quantity)

                    // Update
                    await supabase
                        .from("inventory_items") // Intentionally not checking negative stock to allow tracking even if inventory is messed up, or user can fix later. Or should we block? Better to allow for BDP flow.
                        .update({ quantity: newQty })
                        .eq("id", item.id)

                    console.log(`[BDP] Deducted ${supply.quantity} from ${item.name} (New: ${newQty})`)
                } else {
                    console.warn(`[BDP] Warning: Inventory item not found for supply type '${supply.type}'. Stock not updated.`)
                    // Optional: Create a notification or toast? For now just log.
                }
            }
        }

        revalidatePath("/dashboard/bdp")
        revalidatePath("/dashboard/inventory") // Refresh inventory UI
        revalidatePath("/dashboard") // Refresh KPI Cards
        return { success: true }
    } catch (e) {
        return { error: "Erro interno do servidor" }
    }
}

export async function updateBDPStatus(id: string, newStatus: 'APROVADO' | 'REJEITADO' | 'PENDENTE') {
    const supabase = createClient()

    // We rely on RLS/Policy to ensure only proper roles can update. 
    // However, as a safeguard, we could fetch profile role here too.

    try {
        const { error } = await supabase
            .from("bdp_reports")
            .update({ status: newStatus })
            .eq("id", id)

        if (error) {
            console.error(error)
            return { error: "Erro ao atualizar status" }
        }

        revalidatePath("/dashboard/bdp")
        return { success: true }
    } catch (e) {
        return { error: "Erro interno do servidor" }
    }
}

export async function deleteBDP(id: string) {
    const supabase = createClient()

    try {
        const { error } = await supabase
            .from("bdp_reports")
            .delete()
            .eq("id", id)

        if (error) {
            return { error: "Erro ao excluir boletim" }
        }

        revalidatePath("/dashboard/bdp")
        return { success: true }
    } catch (e) {
        return { error: "Erro interno do servidor" }
    }
}
