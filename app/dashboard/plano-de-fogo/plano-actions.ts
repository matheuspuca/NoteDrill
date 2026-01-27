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

    try {
        const { error } = await supabase
            .from("plano_de_fogo")
            .insert({
                name: data.name,
                project_id: data.projectId,
                description: data.description || null,
                status: "Aberto",
                user_id: user.id
            })

        if (error) {
            console.error("Erro ao criar plano:", error)
            return { error: `Erro ao criar plano: ${error.message}` }
        }

        revalidatePath("/dashboard/plano-de-fogo")
        return { success: true }
    } catch (e: any) {
        return { error: `Erro interno: ${e.message}` }
    }
}

export async function finishPlano(planoId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Usuário não autenticado" }
    }

    try {
        const { error } = await supabase
            .from("plano_de_fogo")
            .update({
                status: "Concluído",
                finished_at: new Date().toISOString()
            })
            .eq("id", planoId)
            .eq("user_id", user.id)

        if (error) {
            console.error("Erro ao finalizar plano:", error)
            return { error: `Erro ao finalizar plano: ${error.message}` }
        }

        revalidatePath("/dashboard/plano-de-fogo")
        revalidatePath(`/dashboard/plano-de-fogo/${planoId}`)
        return { success: true }
    } catch (e: any) {
        return { error: `Erro interno: ${e.message}` }
    }
}

export async function getPlanosByProject(projectId?: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Usuário não autenticado" }
    }

    try {
        let query = supabase
            .from("plano_de_fogo")
            .select(`
                *,
                projects:project_id(id, name)
            `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })

        if (projectId) {
            query = query.eq("project_id", projectId)
        }

        const { data, error } = await query

        if (error) {
            console.error("Erro ao buscar planos:", error)
            return { error: `Erro ao buscar planos: ${error.message}` }
        }

        return { data }
    } catch (e: any) {
        return { error: `Erro interno: ${e.message}` }
    }
}

export async function getPlanoDetails(planoId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Usuário não autenticado" }
    }

    try {
        const { data: plano, error: planoError } = await supabase
            .from("plano_de_fogo")
            .select(`
                *,
                projects:project_id(id, name)
            `)
            .eq("id", planoId)
            .eq("user_id", user.id)
            .single()

        if (planoError) {
            return { error: `Erro ao buscar plano: ${planoError.message}` }
        }

        // Fetch linked BDPs
        const { data: bdps, error: bdpsError } = await supabase
            .from("bdp_reports")
            .select(`
                *,
                operator:operator_id(name),
                drill:drill_id(name)
            `)
            .eq("plano_de_fogo_id", planoId)
            .eq("user_id", user.id)
            .order("date", { ascending: false })

        if (bdpsError) {
            return { error: `Erro ao buscar BDPs: ${bdpsError.message}` }
        }

        return { data: { plano, bdps } }
    } catch (e: any) {
        return { error: `Erro interno: ${e.message}` }
    }
}

export async function updatePlano(id: string, data: PlanoDeFogoSchema) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Usuário não autenticado" }
    }

    try {
        const { error } = await supabase
            .from("plano_de_fogo")
            .update({
                name: data.name,
                project_id: data.projectId,
                description: data.description || null,
            })
            .eq("id", id)
            .eq("user_id", user.id)

        if (error) {
            console.error("Erro ao atualizar plano:", error)
            return { error: `Erro ao atualizar plano: ${error.message}` }
        }

        revalidatePath("/dashboard/plano-de-fogo")
        revalidatePath(`/dashboard/plano-de-fogo/${id}`)
        return { success: true }
    } catch (e: any) {
        return { error: `Erro interno: ${e.message}` }
    }
}

export async function deletePlano(id: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Usuário não autenticado" }
    }

    try {
        // First check if there are linked BDPs
        const { count, error: countError } = await supabase
            .from("bdp_reports")
            .select('*', { count: 'exact', head: true })
            .eq("plano_de_fogo_id", id)

        if (countError) {
            return { error: `Erro ao verificar BDPs: ${countError.message}` }
        }

        if (count && count > 0) {
            return { error: "Não é possível excluir um plano que possui BDPs vinculados. Desvincule-os primeiro." }
        }

        const { error } = await supabase
            .from("plano_de_fogo")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id)

        if (error) {
            console.error("Erro ao excluir plano:", error)
            return { error: `Erro ao excluir plano: ${error.message}` }
        }

        revalidatePath("/dashboard/plano-de-fogo")
        return { success: true }
    } catch (e: any) {
        return { error: `Erro interno: ${e.message}` }
    }
}
