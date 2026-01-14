"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { BDPSchema } from "@/lib/schemas-bdp"
import { subHours } from "date-fns"

export async function createBDP(data: BDPSchema) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Usuário não autenticado" }
    }

    try {
        // Exclude 'services' array as it's not in the DB schema
        const { services, ...rest } = data

        // Standardized mapping: camelCase (Frontend) -> snake_case (Database)
        const dbPayload = {
            date: rest.date || subHours(new Date(), 3).toISOString().split('T')[0],
            shift: rest.shift || 'Diurno',

            // Relations
            project_id: rest.projectId || null,
            operator_id: rest.operatorId || null,
            helper_id: rest.helperId || null,
            drill_id: rest.drillId || null,
            compressor_id: rest.compressorId || null,

            // Counters
            hourmeter_start: rest.hourmeterStart,
            hourmeter_end: rest.hourmeterEnd,
            start_time: rest.startTime,
            end_time: rest.endTime,

            // Geology
            material_description: rest.materialDescription,
            lithology_profile: rest.lithologyProfile,
            rock_status: rest.rockStatus,
            rock_status_reason: rest.rockStatusReason,

            // Stats
            total_meters: rest.totalMeters,
            average_height: rest.averageHeight,
            total_hours: rest.totalHours,

            // JSONB Arrays
            holes: rest.holes,
            occurrences: rest.occurrences,
            supplies: rest.supplies,

            user_id: user.id,
            status: 'PENDENTE'
        }

        console.log(">>> [createBDP] Payload being sent to Supabase:", JSON.stringify(dbPayload, null, 2))

        const { error } = await supabase
            .from("bdp_reports")
            .insert(dbPayload)

        if (error) {
            console.error(">>> [createBDP] Supabase Insert Error Details:", {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            })
            return { error: `Erro SQL: ${error.message} (Code: ${error.code})` }
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

export async function updateBDP(id: string, formData: BDPSchema) {
    const supabase = createClient()
    const { data: user } = await supabase.auth.getUser()

    if (!user || user.user === null) {
        return { error: "Usuário não autenticado" }
    }

    // 1. Map Frontend Schema (camelCase) to Database (snake_case)
    const dbPayload = {
        project_id: formData.projectId,
        operator_id: formData.operatorId,
        helper_id: formData.helperId || null,
        drill_id: formData.drillId,
        compressor_id: formData.compressorId || null,

        date: formData.date,
        shift: formData.shift,
        status: formData.status || 'PENDENTE',

        hourmeter_start: formData.hourmeterStart,
        hourmeter_end: formData.hourmeterEnd,

        start_time: formData.startTime || null,
        end_time: formData.endTime || null,

        material_description: formData.materialDescription || null,
        lithology_profile: formData.lithologyProfile || null,
        rock_status: formData.rockStatus || null,
        rock_status_reason: formData.rockStatusReason || null,

        // Calculated fields (ensure they are updated too)
        total_meters: formData.services.reduce((acc, s) => acc + (s.endDepth || 0) - (s.startDepth || 0), 0),
        average_height: 0,
        total_hours: (formData.hourmeterEnd || 0) - (formData.hourmeterStart || 0),

        // JSONB Arrays
        holes: [],
        services: formData.services,
        occurrences: formData.occurrences,
        supplies: formData.supplies
    }

    try {
        const { error } = await supabase
            .from("bdp_reports")
            .update(dbPayload)
            .eq("id", id)

        if (error) {
            console.error("Supabase Error Update:", error)
            return { error: `Erro ao atualizar BDP: ${error.message}` }
        }

        revalidatePath("/dashboard/bdp")
        return { success: true }

    } catch (e: any) {
        return { error: e.message || "Erro interno do servidor" }
    }
}
