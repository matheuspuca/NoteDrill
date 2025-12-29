"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Pickaxe } from "lucide-react"
import { z } from "zod"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import { authAction } from "@/app/auth/actions" // Importação da Server Action

// Importando os componentes do Shadcn
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
import { loginSchema, signupSchema } from "@/lib/schemas/auth"

export default function AuthPage() {
    const [isLogin, setIsLogin] = React.useState(true)
    const [isLoading, setIsLoading] = React.useState(false)
    const { toast } = useToast()

    // Definição do Form (Dinâmico base no estado)
    const formSchema = isLogin ? loginSchema : signupSchema

    const form = useForm<z.infer<typeof signupSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
            full_name: "",
            company_name: "",
        },
    })

    // Integração com Server Action
    async function onSubmit(data: z.infer<typeof signupSchema>) {
        setIsLoading(true)

        try {
            // Criar FormData para enviar à Server Action
            const formData = new FormData()
            formData.append("mode", isLogin ? "login" : "signup")
            Object.entries(data).forEach(([key, value]) => {
                if (value) formData.append(key, value)
            })

            // Chamada à Server Action
            const result = await authAction(null, formData)

            if (result.success) {
                toast({
                    title: "Sucesso!",
                    description: result.message,
                    variant: "default", // Assumindo default como sucesso/neutro
                })
                // Opcional: Redirecionar aqui se não feito no server side
                // if (isLogin) router.push('/dashboard')
            } else {
                toast({
                    title: "Erro na operação",
                    description: result.message,
                    variant: "destructive",
                })

                // Exibir erros de campo se houver
                if (result.errors) {
                    // Logica adicional para mostrar erros específicos se necessário
                }
            }
        } catch (error) {
            toast({
                title: "Erro Inesperado",
                description: "Não foi possível conectar ao servidor.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full h-screen lg:grid lg:grid-cols-2">
            <Toaster /> {/* Componente de Toast para feedback */}

            {/* --- COLUNA ESQUERDA: BRANDING & PERSUASÃO (Visible on Desktop) --- */}
            <div className="hidden bg-zinc-900 lg:flex flex-col justify-between p-10 text-white">
                <div className="flex items-center gap-2 text-lg font-bold tracking-tight">
                    <Pickaxe className="h-6 w-6 text-yellow-500" /> {/* Ícone temático */}
                    <span>GeoBlaster PRO</span>
                </div>

                <div className="z-20 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-lg">
                            &ldquo;A precisão no desmonte de rochas não é apenas sobre eficiência,
                            é sobre segurança absoluta. Esta plataforma transformou nosso controle
                            de detonações.&rdquo;
                        </p>
                        <footer className="text-sm text-zinc-400">
                            Antonio V., Engenheiro Sênior de Geotecnia
                        </footer>
                    </blockquote>
                </div>
            </div>

            {/* --- COLUNA DIREITA: FORMULÁRIO (Mobile First) --- */}
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
                <div className="mx-auto grid w-full max-w-[350px] gap-6">

                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {isLogin ? "Acesso ao Sistema" : "Novo Registro Técnico"}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {isLogin
                                ? "Entre com suas credenciais operacionais."
                                : "Crie uma conta para gerenciar projetos de desmonte."}
                        </p>
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                            {/* Nome Completo (Apenas Signup) */}
                            {!isLogin && (
                                <FormField
                                    control={form.control}
                                    name="full_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Responsável Técnico</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Eng. Carlos Silva" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* Email */}
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>E-mail Corporativo</FormLabel>
                                        <FormControl>
                                            <Input placeholder="nome@empresa.com.br" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Empresa (Apenas Signup - Opcional) */}
                            {!isLogin && (
                                <FormField
                                    control={form.control}
                                    name="company_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Empresa / Contratante (Opcional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Construtora XYZ" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            {/* Senha */}
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Chave de Acesso</FormLabel>
                                        <FormControl>
                                            <Input type="password" placeholder="••••••••" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button disabled={isLoading} className="w-full bg-zinc-900 hover:bg-zinc-800" type="submit">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isLogin ? "Acessar Painel" : "Criar Conta Segura"}
                            </Button>
                        </form>
                    </Form>

                    {/* Toggle Login/Signup */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                                Ou continue com
                            </span>
                        </div>
                    </div>

                    <div className="text-center text-sm">
                        {isLogin ? "Não possui credenciais? " : "Já possui acesso? "}
                        <button
                            type="button"
                            onClick={() => {
                                setIsLogin(!isLogin)
                                form.reset() // Limpa erros ao trocar de modo
                            }}
                            className="underline underline-offset-4 hover:text-primary font-medium"
                        >
                            {isLogin ? "Solicitar registro" : "Fazer login"}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}
