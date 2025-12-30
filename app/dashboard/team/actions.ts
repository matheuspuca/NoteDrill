"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { teamMemberSchema, TeamMemberSchema } from "@/lib/schemas-team"

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

    // Create System User if requested
    if (validated.createSystemUser && validated.email && validated.password) {
        console.log("--> Starting System User Creation for:", validated.email)

        const adminClient = createAdminClient()
        if (!adminClient) {
            console.error("--> ERROR: Service Role Key missing.")
            return { error: "Erro de configuração: Chave Service Role não encontrada. Contate o suporte." }
        }

        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
            email: validated.email,
            password: validated.password,
            email_confirm: true,
            user_metadata: { role: validated.systemRole, full_name: validated.name }
        })

        if (authError) {
            console.error("--> Auth Create Error:", authError)
            return { error: `Erro ao criar usuário: ${authError.message}` }
        }

        console.log("--> User Created Successfully in Auth. User ID:", authData.user.id)
        linkedUserId = authData.user.id

        // Update Profile Role immediately
        console.log("--> Updating Profile Role to:", validated.systemRole)
        const { error: profileError } = await adminClient
            .from('profiles')
            .update({ role: validated.systemRole })
            .eq('id', linkedUserId)

        if (profileError) {
            console.error("--> Profile Role Update Error:", profileError)
            // Non-blocking error, but good to know
        } else {
            console.log("--> Profile Role Updated Successfully.")
        }
    }

    // Clean data for insert (remove system fields)
    const { createSystemUser, systemRole, password, ...dbData } = validated

    const { error } = await supabase.from("team_members").insert({
        ...dbData,
        user_id: user.id, // Created By
        linked_user_id: linkedUserId
    })

    if (error) {
        console.error("Erro ao adicionar membro:", error)
        // Note: If DB insert fails, we might have an orphaned Auth User. 
        // Ideal: Transaction or cleanup. For MVP: Log error.
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
