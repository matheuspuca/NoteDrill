"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Loader2, ShieldCheck, Key } from "lucide-react"
import { z } from "zod"
import { useToast } from "@/components/ui/use-toast"
import { authAction } from "@/app/auth/actions"
import AuthLayout from "@/components/auth/auth-layout"
import { loginSchema } from "@/lib/schemas/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Toaster } from "@/components/ui/toaster"

import { ForgotPasswordDialog } from "@/components/auth/ForgotPasswordDialog"

export default function LoginPage() {
    const [isLoading, setIsLoading] = React.useState(false)
    const { toast } = useToast()

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(data: z.infer<typeof loginSchema>) {
        setIsLoading(true)

        try {
            const formData = new FormData()
            formData.append("mode", "login")
            formData.append("email", data.email)
            formData.append("password", data.password)

            const result = await authAction(null, formData)

            if (result.success) {
                toast({
                    title: "Acesso Permitido",
                    description: "Login realizado com sucesso.",
                    variant: "default",
                })
                window.location.href = "/dashboard"
            } else {
                toast({
                    title: "Falha na Autenticação",
                    description: result.message,
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Erro de Conexão",
                description: "Servidor indisponível.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Conteúdo da Sidebar para Login (Increased Typography)
    const sidebarContent = (
        <div className="space-y-8">
            <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.1] drop-shadow-xl">
                Bem-vindo(a) de volta ao <br /> controle total.
            </h1>

            <div className="flex items-start gap-5 p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                    <ShieldCheck className="h-8 w-8 text-blue-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Ambiente Seguro</h3>
                    <p className="text-blue-100 text-base mt-2 leading-relaxed opacity-80">
                        Seus dados são protegidos com criptografia de ponta a ponta e auditoria contínua.
                    </p>
                </div>
            </div>
        </div>
    )

    return (
        <AuthLayout sideContent={sidebarContent}>
            <Toaster />

            <div className="space-y-3 mb-8">
                <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Acesse sua conta.</h2>
                <p className="text-lg text-slate-500">
                    Entre com suas credenciais para acessar o painel.
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormLabel className="text-lg font-bold text-slate-700">E-mail Corporativo</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="nome@suaempresa.com"
                                        {...field}
                                        className="h-16 px-6 text-lg bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl transition-all shadow-sm"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <FormLabel className="text-lg font-bold text-slate-700">Senha</FormLabel>
                                    <ForgotPasswordDialog />
                                </div>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type="password"
                                            placeholder="Sua senha de acesso"
                                            {...field}
                                            className="h-16 px-6 text-lg bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl transition-all shadow-sm pr-12"
                                        />
                                        <Key className="absolute right-4 top-5 h-6 w-6 text-slate-400" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        disabled={isLoading}
                        className="w-full h-16 bg-[#2563EB] hover:bg-blue-600 text-lg font-bold rounded-xl shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.01]"
                        type="submit"
                    >
                        {isLoading && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                        Entrar no Sistema
                        <ArrowRight className="ml-3 h-5 w-5" />
                    </Button>

                    <div className="relative my-10">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-4 text-slate-400 font-semibold tracking-wider">
                                Novo por aqui?
                            </span>
                        </div>
                    </div>

                    <Link href="/signup">
                        <Button variant="outline" className="w-full h-16 border-slate-200 text-slate-700 hover:bg-slate-50 text-lg font-semibold rounded-xl" type="button">
                            Criar Conta Gratuita
                        </Button>
                    </Link>

                </form>
            </Form>
        </AuthLayout>
    )
}
