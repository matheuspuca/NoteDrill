"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { inventoryItemSchema, InventoryItemSchema } from "@/lib/schemas-inventory"

export async function createInventoryItem(data: InventoryItemSchema) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Usuário não autenticado" }

    const { success, data: validated } = inventoryItemSchema.safeParse(data)
    if (!success) return { error: "Dados inválidos" }

    const { error } = await supabase.from("inventory_items").insert({ ...validated, user_id: user.id })

    if (error) {
        console.error("Erro ao criar item:", error)
        return { error: "Erro ao criar item" }
    }

    revalidatePath("/dashboard/inventory")
    return { success: true }
}

export async function updateInventoryItem(id: string, data: InventoryItemSchema) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Usuário não autenticado" }

    const { success, data: validated } = inventoryItemSchema.safeParse(data)
    if (!success) return { error: "Dados inválidos" }

    const { error } = await supabase.from("inventory_items").update(validated).eq("id", id)

    if (error) return { error: "Erro ao atualizar item" }

    revalidatePath("/dashboard/inventory")
    return { success: true }
}

export async function deleteInventoryItem(id: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Usuário não autenticado" }

    const { error } = await supabase.from("inventory_items").delete().eq("id", id)

    if (error) return { error: "Erro ao excluir item" }

    revalidatePath("/dashboard/inventory")
    return { success: true }
}

export async function transferStock(data: { itemId: string, targetProjectId: string, quantity: number }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Usuário não autenticado" }

    const qty = Number(data.quantity)
    if (isNaN(qty) || qty <= 0) return { error: "Quantidade inválida." }

    // 1. Get Source Item
    const { data: sourceItem, error: sourceError } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("id", data.itemId)
        .single()

    if (sourceError || !sourceItem) return { error: "Item de origem não encontrado" }

    // Check if source and target projects are the same
    if (sourceItem.projectId === data.targetProjectId) {
        return { error: "A obra de origem e destino não podem ser a mesma." }
    }

    if (Number(sourceItem.quantity) < qty) return { error: "Quantidade insuficiente em estoque." }

    // Normalize brand
    const brand = sourceItem.brand || null

    // 2. Check if Target Item exists (Same name, brand, unit, but different project)
    const { data: targetItem, error: targetError } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("name", sourceItem.name)
        .eq("projectId", data.targetProjectId)
        // strict matching
        .eq("unit", sourceItem.unit)
        .filter("brand", brand ? "eq" : "is", brand)
        .maybeSingle()

    // 3. Perform Updates
    // A. Deduct from Source
    const newSourceQty = Number(sourceItem.quantity) - qty
    const { error: deductError } = await supabase
        .from("inventory_items")
        .update({ quantity: newSourceQty })
        .eq("id", sourceItem.id)

    if (deductError) return { error: "Erro ao descontar estoque." }

    // B. Add to Target
    if (targetItem) {
        // Update existing
        const newTargetQty = Number(targetItem.quantity) + qty
        const { error: addError } = await supabase
            .from("inventory_items")
            .update({ quantity: newTargetQty })
            .eq("id", targetItem.id)

        if (addError) return { error: "Erro ao adicionar estoque no destino." }
    } else {
        // Create new item in target project
        const { error: createError } = await supabase
            .from("inventory_items")
            .insert({
                name: sourceItem.name,
                projectId: data.targetProjectId,
                unit: sourceItem.unit,
                brand: brand,
                quantity: qty,
                value: sourceItem.value,
                minStock: sourceItem.minStock,
                user_id: user.id,
                type: sourceItem.type || "Material" // Preserve type
            })

        if (createError) {
            console.error("Erro ao criar item no destino:", createError)
            // Rollback source if possible? Ideally use RPC, but for now just return error
            return { error: "Erro ao criar item no destino." }
        }
    }

    revalidatePath("/dashboard/inventory")
    return { success: true }
}


// --- EPI Server Actions ---

import { epiSchema, EPISchema } from "@/lib/schemas-epi"

export async function createEPI(data: EPISchema) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Usuário não autenticado" }

    const { success, data: validated } = epiSchema.safeParse(data)
    if (!success) return { error: "Dados inválidos" }

    const { error } = await supabase.from("inventory_epis").insert({ ...validated, user_id: user.id })

    if (error) {
        console.error("Erro ao criar EPI:", error)
        return { error: "Erro ao criar EPI" }
    }

    revalidatePath("/dashboard/inventory")
    return { success: true }
}

export async function updateEPI(id: string, data: EPISchema) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Usuário não autenticado" }

    const { success, data: validated } = epiSchema.safeParse(data)
    if (!success) return { error: "Dados inválidos" }

    const { error } = await supabase.from("inventory_epis").update(validated).eq("id", id)

    if (error) return { error: "Erro ao atualizar EPI" }

    revalidatePath("/dashboard/inventory")
    return { success: true }
}

export async function deleteEPI(id: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Usuário não autenticado" }

    const { error } = await supabase.from("inventory_epis").delete().eq("id", id)

    if (error) return { error: "Erro ao excluir EPI" }

    revalidatePath("/dashboard/inventory")
    return { success: true }
}

export async function createPriceHistory(data: { itemName: string, price: number, date: string }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Usuário não autenticado" }

    const { error } = await supabase.from("inventory_price_history").insert({
        item_name: data.itemName,
        price: data.price,
        date: data.date,
        user_id: user.id
    })

    if (error) {
        console.error("Erro ao salvar histórico:", error)
        return { error: "Erro ao salvar histórico" }
    }

    revalidatePath("/dashboard/inventory")
    return { success: true }
}
