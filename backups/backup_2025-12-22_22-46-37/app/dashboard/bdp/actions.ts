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
        const { error } = await supabase
            .from("bdp_reports")
            .insert({
                ...data,
                user_id: user.id,
            })

        if (error) {
            console.error(error)
            return { error: "Erro ao criar boletim" }
        }

        revalidatePath("/dashboard/bdp")
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
