"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { PlanoDeFogoSchema } from "@/lib/schemas-plano"

export async function createPlano(data: PlanoDeFogoSchema) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Usuário não autenticado" }
    }

    const { error } = await supabase.from('plano_de_fogo').insert({
        name: data.name,
        project_id: data.projectId,
        description: data.description,
        status: 'Aberto',
        user_id: user.id
    })

    if (error) {
        console.error("Error creating Plano de Fogo:", error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/plano-de-fogo')
    return { success: true }
}

export async function finishPlano(id: string) {
    const supabase = createClient()

    const { error } = await supabase.from('plano_de_fogo').update({
        status: 'Concluído',
        finished_at: new Date().toISOString()
    }).eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/dashboard/plano-de-fogo`)
    return { success: true }
}

export async function getPlanosByProject(projectId: string) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('plano_de_fogo')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error("Error fetching Planos:", error)
        return []
    }

    return data
}

export async function getPlanoDetails(id: string) {
    const supabase = createClient()

    // Fetch Plano details
    const { data: plano, error: planoError } = await supabase
        .from('plano_de_fogo')
        .select('*, projects(name)')
        .eq('id', id)
        .single()

    if (planoError) {
        return { error: "Plano não encontrado" }
    }

    // Fetch associated BDPs
    // We want a summary: Date, Drill, Operator, Meters, Status
    const { data: bdps, error: bdpError } = await supabase
        .from('bdp_reports')
        .select(`
            id, 
            date, 
            status, 
            total_meters,
            equipment:drill_id(name),
            operator:operator_id(name)
        `)
        .eq('plano_de_fogo_id', id)
        .order('date', { ascending: false })

    if (bdpError) {
        console.error("Error fetching BDPs for Plano:", bdpError)
    }

    return { plano, bdps: bdps || [] }
}
