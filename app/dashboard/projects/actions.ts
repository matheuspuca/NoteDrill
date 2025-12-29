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
        console.error("Validation Error:", result.error)
        return { error: "Dados inválidos: " + JSON.stringify(result.error.flatten()) }
    }

    console.log("Creating project with data:", result.data)

    const { error } = await supabase.from("projects").insert({
        ...result.data,
        user_id: user.id,
    })

    if (error) {
        console.error("Supabase Error creating project:", error)
        return { error: `Erro ao criar obra: ${error.message} (Code: ${error.code})` }
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
        console.error("Validation Error:", result.error)
        return { error: "Dados inválidos: " + JSON.stringify(result.error.flatten()) }
    }

    console.log("Updating project", id, "with data:", result.data)

    const { error } = await supabase
        .from("projects")
        .update(result.data)
        .eq("id", id)
        .eq("user_id", user.id)

    if (error) {
        console.error("Supabase Error updating project:", error)
        return { error: "Erro ao atualizar obra: " + error.message }
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
