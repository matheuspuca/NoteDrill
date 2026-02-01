"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { teamMemberSchema, TeamMemberSchema } from "@/lib/schemas-team"
import { checkTeamLimits } from "@/lib/subscription-utils"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Helper for Admin operations (User Creation)
function createAdminClient() {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}

export async function createTeamMember(data: TeamMemberSchema) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Usuário não autenticado" }

    const { success, data: validated, error: validationError } = teamMemberSchema.safeParse(data)
    if (!success) {
        console.error("--> Validation Error:", validationError.flatten())
        return { error: "Dados inválidos: " + JSON.stringify(validationError.flatten().fieldErrors) }
    }

    let linkedUserId = null

    // Invite System User if requested
    if (validated.createSystemUser && validated.email) {
        console.log("--> Starting System User Invite for:", validated.email)

        const limitCheck = await checkTeamLimits(user.id, validated.systemRole as 'supervisor' | 'operator')
        if (!limitCheck.allowed) {
            console.error("Limit Reached:", limitCheck.reason)
            return { error: limitCheck.reason }
        }

        // Call Edge Function
        const { data: inviteData, error: inviteError } = await supabase.functions.invoke('invite-team-member', {
            body: {
                email: validated.email,
                role: validated.systemRole,
                fullName: validated.name,
                projectId: validated.projectId,
                redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/update-password`
            }
        })

        if (inviteError) {
            console.error("--> Invite Error:", inviteError)
            return { error: "Erro ao enviar convite: " + inviteError.message }
        }

        // Edge function returns userId if successful
        if (inviteData?.userId) {
            linkedUserId = inviteData.userId
        }
    }

    // Clean data for insert (remove system fields and sanitize dates)
    const { createSystemUser, systemRole, projectId, email, ...dbData } = validated

    // Sanitize dates (empty string -> null)
    const sanitizedData = {
        ...dbData,
        birthDate: dbData.birthDate || null,
        admissionDate: dbData.admissionDate || null,
        asoDate: dbData.asoDate || null,
    }

    // Insert into basic team_members list (HR record)
    const { error } = await supabase.from("team_members").insert({
        ...sanitizedData,
        email: validated.email, // Save email in HR record too
        user_id: user.id, // Created By
        linked_user_id: linkedUserId
    })

    if (error) {
        console.error("Erro ao adicionar membro:", error)
        return { error: "Erro ao adicionar membro à equipe" }
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

    // Clean data (remove system fields that are not columns in team_members)
    const { createSystemUser, systemRole, projectId, ...dbPayload } = validated

    const sanitizedPayload = {
        ...dbPayload,
        birthDate: dbPayload.birthDate || null,
        admissionDate: dbPayload.admissionDate || null,
        asoDate: dbPayload.asoDate || null,
    }

    const { error } = await supabase.from("team_members").update(sanitizedPayload).eq("id", id)

    if (error) return { error: "Erro ao atualizar membro" }

    revalidatePath("/dashboard/team")
    return { success: true }
}

export async function deleteTeamMember(id: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: "Usuário não autenticado" }

    const { error } = await supabase.from("team_members").delete().eq("id", id)

    if (error) {
        console.error("Delete Member Error:", error)
        return { error: `Erro ao excluir: ${error.message}` }
    }

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
