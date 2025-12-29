"use server"

import { createClient } from "@/lib/supabase/server"
import { projectSchema, ProjectSchema } from "@/lib/schemas-project"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createProject(data: ProjectSchema) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Usuário não autenticado")
    }

    const result = projectSchema.safeParse(data)

    if (!result.success) {
        return { error: "Dados inválidos" }
    }

    const { error } = await supabase.from("projects").insert({
        ...result.data,
        user_id: user.id,
    })

    if (error) {
        console.error("Error creating project:", error)
        return { error: "Erro ao criar obra" }
    }

    revalidatePath("/dashboard/projects")
    return { success: true }
}

export async function updateProject(id: string, data: ProjectSchema) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Usuário não autenticado")
    }

    const result = projectSchema.safeParse(data)

    if (!result.success) {
        return { error: "Dados inválidos" }
    }

    const { error } = await supabase
        .from("projects")
        .update(result.data)
        .eq("id", id)
        // Ensure user owns the project or has permission (assuming user_id check is enough for now)
        .eq("user_id", user.id)

    if (error) {
        console.error("Error updating project:", error)
        return { error: "Erro ao atualizar obra" }
    }

    revalidatePath("/dashboard/projects")
    return { success: true }
}

export async function deleteProject(id: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Usuário não autenticado")
    }

    const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)

    if (error) {
        console.error("Error deleting project:", error)
        return { error: "Erro ao deletar obra" }
    }

    revalidatePath("/dashboard/projects")
    return { success: true }
}
