"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { teamMemberSchema, TeamMemberSchema } from "@/lib/schemas-team"

export async function createTeamMember(data: TeamMemberSchema) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Usuário não autenticado" }

    const { success, data: validated } = teamMemberSchema.safeParse(data)
    if (!success) return { error: "Dados inválidos" }

    const { error } = await supabase.from("team_members").insert({ ...validated, user_id: user.id })

    if (error) {
        console.error("Erro ao adicionar membro:", error)
        return { error: "Erro ao adicionar membro" }
    }

    revalidatePath("/dashboard/team")
    return { success: true }
}

export async function updateTeamMember(id: string, data: TeamMemberSchema) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Usuário não autenticado" }

    const { success, data: validated } = teamMemberSchema.safeParse(data)
    if (!success) return { error: "Dados inválidos" }

    const { error } = await supabase.from("team_members").update(validated).eq("id", id)

    if (error) return { error: "Erro ao atualizar membro" }

    revalidatePath("/dashboard/team")
    return { success: true }
}

export async function deleteTeamMember(id: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Usuário não autenticado" }

    const { error } = await supabase.from("team_members").delete().eq("id", id)

    if (error) return { error: "Erro ao excluir membro" }

    revalidatePath("/dashboard/team")
    return { success: true }
}

export async function assignEpi(data: { teamMemberId: string, epiId: string, quantity: number, date?: string }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Usuário não autenticado" }

    // 1. Check stock
    const { data: epi } = await supabase.from("inventory_epis").select("quantity, name").eq("id", data.epiId).single()

    if (!epi) return { error: "EPI não encontrado" }
    if (Number(epi.quantity) < data.quantity) {
        return { error: `Estoque insuficiente de ${epi.name}. Disponível: ${epi.quantity}` }
    }

    // 2. Insert Usage Log
    const { error: usageError } = await supabase.from("epi_usage").insert({
        teamMemberId: data.teamMemberId,
        epiId: data.epiId,
        quantity: data.quantity,
        date: data.date || new Date().toISOString(),
        user_id: user.id
    })

    if (usageError) {
        console.error("Assign EPI Error:", usageError)
        return { error: "Erro ao registrar entrega de EPI" }
    }

    // 3. Deduct Stock
    // Note: Supabase doesn't support 'decrement' directly without RPC easily, but for MVP we read/write.
    // Ideally use RPC but simple update is fine for now.
    const { error: updateError } = await supabase.from("inventory_epis")
        .update({ quantity: Number(epi.quantity) - data.quantity })
        .eq("id", data.epiId)

    if (updateError) {
        console.error("Stock Deduction Error:", updateError)
        return { error: "EPI entregue, mas erro ao atualizar estoque." }
    }

    revalidatePath("/dashboard/team")
    revalidatePath("/dashboard/inventory") // Update inventory page too
    return { success: true }
}

export async function getEpiHistory(memberId: string) {
    const supabase = createClient()
    const { data } = await supabase.from("epi_usage")
        .select(`
            id, date, quantity,
            inventory_epis ( name, ca, unit )
        `)
        .eq("teamMemberId", memberId)
        .order("date", { ascending: false })

    return data || []
}
