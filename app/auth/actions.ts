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

export async function resetPasswordAction(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
    const email = formData.get("email") as string
    const supabase = createClient()

    if (!email) {
        return { success: false, message: "Email é obrigatório." }
    }

    try {
        // Construct the redirect URL for the reset password flow
        // The user will be redirected to the /dashboard/settings?tab=security or a dedicated page
        // For now, let's point to the origin + /dashboard/settings
        // Note: Supabase needs 'SITE_URL' or allowed redirect URLs configured. 
        // We will trust Supabase default behavior or simple localhost for now.

        // Use origin if available from headers? In server action, hard to get without headers(), 
        // but Supabase usually handles specific callback logic or we pass redirectTo.
        // Let's assume the callback route handles the session.

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/auth/callback?next=/dashboard/settings`,
        })

        if (error) {
            return { success: false, message: error.message }
        }

        return { success: true, message: "Link de recuperação enviado para o e-mail." }
    } catch (error) {
        return { success: false, message: "Erro ao tentar recuperar senha." }
    }
}
