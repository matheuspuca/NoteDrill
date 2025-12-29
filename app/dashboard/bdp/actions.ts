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
        // Exclude 'services' array as it's not in the DB schema (it's flattened into 'holes')
        const { services, ...dbData } = data

        const { error } = await supabase
            .from("bdp_reports")
            .insert({
                ...dbData,
                user_id: user.id,
            })

        if (error) {
            console.error(error)
            return { error: "Erro ao criar boletim" }
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
