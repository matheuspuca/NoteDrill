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
