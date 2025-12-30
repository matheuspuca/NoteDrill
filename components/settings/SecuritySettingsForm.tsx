"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, KeyRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { updatePassword } from "@/app/dashboard/settings/actions"

const passwordSchema = z.object({
    password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
})

export function SecuritySettingsForm() {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    })

    async function onSubmit(data: z.infer<typeof passwordSchema>) {
        setIsLoading(true)
        try {
            const result = await updatePassword(data.password)

            if (result.error) {
                toast({
                    variant: "destructive",
                    title: "Erro ao atualizar senha",
                    description: result.error,
                })
            } else {
                toast({
                    title: "Senha atualizada",
                    description: "Sua senha foi alterada com sucesso.",
                })
                form.reset()
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Ocorreu um erro inesperado.",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader className="gap-2">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <KeyRound className="w-6 h-6 text-blue-700" />
                    </div>
                    <div>
                        <CardTitle className="text-xl">Alteração de Senha</CardTitle>
                        <CardDescription>
                            Atualize sua senha de acesso ao sistema.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-xl">
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nova Senha</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Digite sua nova senha" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirmar Nova Senha</FormLabel>
                                    <FormControl>
                                        <Input type="password" placeholder="Confirme sua nova senha" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Atualizar Senha
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
