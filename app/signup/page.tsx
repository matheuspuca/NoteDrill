"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Loader2, Lock } from "lucide-react"
import { z } from "zod"
import { useToast } from "@/components/ui/use-toast"
import { authAction } from "@/app/auth/actions"
import AuthLayout from "@/components/auth/auth-layout"
import { signupSchema } from "@/lib/schemas/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Toaster } from "@/components/ui/toaster"

export default function SignupPage() {
    const [isLoading, setIsLoading] = React.useState(false)
    const { toast } = useToast()

    const form = useForm<z.infer<typeof signupSchema>>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            full_name: "",
            email: "",
            password: "",
            company_name: "",
        },
    })

    async function onSubmit(data: z.infer<typeof signupSchema>) {
        setIsLoading(true)

        try {
            const formData = new FormData()
            formData.append("mode", "signup")
            formData.append("full_name", data.full_name)
            formData.append("email", data.email)
            formData.append("password", data.password)
            if (data.company_name) formData.append("company_name", data.company_name)

            const result = await authAction(null, formData)

            if (result.success) {
                toast({
                    title: "Conta Criada",
                    description: "Verifique seu e-mail para confirmar.",
                    variant: "default",
                })
            } else {
                toast({
                    title: "Erro no Cadastro",
                    description: result.message,
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Erro de Conexão",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Conteúdo da Sidebar para Signup (Increased Typography)
    const sidebarContent = (
        <div className="space-y-8">
            <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.1] drop-shadow-xl">
                A revolução na <br /> gestão de perfuração.
            </h1>

            <div className="pl-6 border-l-[6px] border-orange-500 py-3">
                <p className="text-2xl text-white/95 font-medium leading-relaxed">
                    "Controle custos, estoque e produtividade em uma única plataforma integrada."
                </p>
            </div>
        </div>
    )

    return (
        <AuthLayout sideContent={sidebarContent}>
            <Toaster />

            <div className="space-y-3 mb-8">
                <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Crie sua conta.</h2>
                <p className="text-lg text-slate-500">
                    Teste a plataforma líder por <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">7 dias grátis</span>.
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    <FormField
                        control={form.control}
                        name="full_name"
                        render={({ field }) => (
                            <FormItem className="space-y-2">
                                <FormLabel className="text-base font-bold text-slate-700">Nome Completo</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Carlos Engenharia" {...field} className="h-14 px-4 text-base bg-slate-50 border-slate-200 focus:bg-white rounded-xl" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-5">
                        <FormField
                            control={form.control}
                            name="company_name"
                            render={({ field }) => (
                                <FormItem className="space-y-2">
                                    <FormLabel className="text-base font-bold text-slate-700">Empresa</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Mineração LTDA" {...field} className="h-14 px-4 text-base bg-slate-50 border-slate-200 focus:bg-white rounded-xl" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="space-y-2">
                            <label className="text-base font-bold leading-none text-slate-700">Telefone</label>
                            <Input placeholder="(00) 00000-0000" className="h-14 px-4 text-base bg-slate-50 border-slate-200 focus:bg-white rounded-xl" />
                        </div>
                    </div>

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem className="space-y-2">
                                <FormLabel className="text-base font-bold text-slate-700">E-mail Corporativo</FormLabel>
                                <FormControl>
                                    <Input placeholder="nome@suaempresa.com" {...field} className="h-14 px-4 text-base bg-slate-50 border-slate-200 focus:bg-white rounded-xl" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem className="space-y-2">
                                <FormLabel className="text-base font-bold text-slate-700">Senha</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type="password"
                                            placeholder="Crie uma senha segura"
                                            {...field}
                                            className="h-14 px-4 text-base bg-slate-50 border-slate-200 focus:bg-white pr-10 rounded-xl"
                                        />
                                        <Lock className="absolute right-4 top-4 h-5 w-5 text-slate-400" />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        disabled={isLoading}
                        className="w-full h-16 bg-[#2563EB] hover:bg-blue-600 text-lg font-bold rounded-xl shadow-xl shadow-blue-500/20 mt-4 transition-all hover:scale-[1.01]"
                        type="submit"
                    >
                        {isLoading && <Loader2 className="mr-3 h-5 w-5 animate-spin" />}
                        Iniciar Teste Grátis
                        <ArrowRight className="ml-3 h-5 w-5" />
                    </Button>

                    <div className="flex justify-center gap-4 mt-8">
                        <div className="flex items-center gap-2 text-xs text-slate-500 uppercase font-bold tracking-widest border border-slate-200 px-3 py-1.5 rounded-lg bg-slate-50">
                            <Lock className="w-3 h-3 text-green-600" /> SSL Secure
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 uppercase font-bold tracking-widest border border-slate-200 px-3 py-1.5 rounded-lg bg-slate-50">
                            ⚡ 99.9% Uptime
                        </div>
                    </div>

                </form>
            </Form>
        </AuthLayout>
    )
}
