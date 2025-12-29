"use server"

import { z } from "zod"
import { loginSchema, signupSchema } from "@/lib/schemas/auth"
import { createClient } from "@/lib/supabase/server"

export type AuthState = {
    success: boolean
    message: string
    errors?: Record<string, string[]>
}

export async function authAction(
    prevState: AuthState | null,
    formData: FormData
): Promise<AuthState> {
    const rawData = Object.fromEntries(formData.entries())
    const mode = formData.get("mode") as string
    const supabase = createClient()

    try {
        if (mode === "login") {
            const validatedFields = loginSchema.safeParse(rawData)

            if (!validatedFields.success) {
                return {
                    success: false,
                    message: "Erro na validação dos campos.",
                    errors: validatedFields.error.flatten().fieldErrors,
                }
            }

            const { error } = await supabase.auth.signInWithPassword({
                email: validatedFields.data.email,
                password: validatedFields.data.password,
            })

            if (error) {
                return { success: false, message: error.message }
            }

            return { success: true, message: "Login realizado com sucesso!" }
        }

        // Modo Cadastro
        else {
            const validatedFields = signupSchema.safeParse(rawData)

            if (!validatedFields.success) {
                return {
                    success: false,
                    message: "Erro na validação dos campos.",
                    errors: validatedFields.error.flatten().fieldErrors,
                }
            }

            const { error } = await supabase.auth.signUp({
                email: validatedFields.data.email,
                password: validatedFields.data.password,
                options: {
                    data: {
                        full_name: validatedFields.data.full_name,
                        company_name: validatedFields.data.company_name
                    }
                }
            })

            if (error) {
                return { success: false, message: error.message }
            }

            return { success: true, message: "Conta criada com sucesso! Verifique seu e-mail." }
        }
    } catch (error) {
        return {
            success: false,
            message: "Ocorreu um erro inesperado no servidor. Tente novamente.",
        }
    }
}
