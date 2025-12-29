"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Save, Upload, User, Camera, LogOut } from "lucide-react"
import { ProfileSettingsSchema, profileSettingsSchema } from "@/lib/schemas-settings"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { updateProfile } from "@/app/dashboard/settings/actions"

export function ProfileSettingsForm({ initialData }: { initialData?: any }) {
    const { toast } = useToast()
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(initialData?.avatar_url || null)
    const [email, setEmail] = useState(initialData?.user_email || "")
    const form = useForm<ProfileSettingsSchema>({
        resolver: zodResolver(profileSettingsSchema),
        defaultValues: {
            full_name: initialData?.full_name || "",
            username: initialData?.username || "",
            website: initialData?.website || "",
        },
    })

    const watchedFullName = form.watch("full_name")



    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = event.target.files?.[0]
            if (!file) return

            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Usuário não logado")

            const fileExt = file.name.split('.').pop()
            const filePath = `${user.id}-${Math.random()}.${fileExt}`

            // Use 'avatars' bucket (standard Supabase starter bucket)
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            setAvatarUrl(publicUrl)

            // Auto update profile mainly to refresh UI immediately
            await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id)

            toast({ title: "Avatar atualizado", description: "Sua foto de perfil foi alterada." })
            router.refresh()
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro no upload", description: error.message })
        }
    }

    const onSubmit = async (data: ProfileSettingsSchema) => {
        setIsPending(true)

        const result = await updateProfile({
            ...data,
            avatar_url: avatarUrl
        })

        if (result.error) {
            console.error("Erro ao salvar perfil:", result.error)
            toast({ variant: "destructive", title: "Erro ao salvar", description: result.error })
        } else {
            toast({ title: "Perfil atualizado", description: "Seus dados foram salvos com sucesso." })
            router.refresh()
        }

        setIsPending(false)
    }



    return (
        <Card className="border-none shadow-lg bg-white rounded-2xl ring-1 ring-slate-100">
            <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <User className="w-6 h-6 text-blue-600" />
                    Meu Perfil
                </CardTitle>
                <CardDescription className="text-base text-slate-500">Gerencie suas informações pessoais e de acesso.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                        toast({ variant: "destructive", title: "Erro de Validação", description: "Verifique os campos obrigatórios." })
                    })} className="space-y-8">

                        {/* Avatar Section */}
                        <div className="flex items-center gap-6">
                            <div className="relative group">
                                <Avatar className="w-24 h-24 border-4 border-white shadow-lg cursor-pointer">
                                    <AvatarImage src={avatarUrl || ""} />
                                    <AvatarFallback className="bg-slate-100 text-slate-400 text-2xl font-bold">
                                        {watchedFullName?.[0]?.toUpperCase() || email?.[0]?.toUpperCase() || <User />}
                                    </AvatarFallback>
                                </Avatar>
                                <label
                                    htmlFor="avatar-upload"
                                    className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-sm"
                                >
                                    <Camera className="w-4 h-4" />
                                </label>
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarUpload}
                                />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Foto de Perfil</h3>
                                <p className="text-slate-500 text-sm">Clique no ícone da câmera para alterar sua foto.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormItem>
                                <FormLabel className="text-lg font-semibold text-slate-700">Email (Fixo)</FormLabel>
                                <FormControl><Input value={email} disabled className="bg-slate-50 h-14 text-lg" /></FormControl>
                                <FormDescription className="text-sm">O email não pode ser alterado aqui.</FormDescription>
                            </FormItem>

                            <FormField control={form.control} name="username" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-lg font-semibold text-slate-700">Nome de Usuário</FormLabel>
                                    <FormControl><Input className="h-14 text-lg" placeholder="@usuario" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="full_name" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-lg font-semibold text-slate-700">Nome Completo</FormLabel>
                                <FormControl><Input className="h-14 text-lg" placeholder="Seu nome" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="flex justify-end">
                            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 h-14 px-10 text-lg">
                                {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                                Salvar Perfil
                            </Button>
                        </div>
                    </form>
                </Form>

                <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-center md:text-left">
                        <h4 className="font-bold text-slate-800">Sair da Conta</h4>
                        <p className="text-sm text-slate-500">Encerre sua sessão atual com segurança.</p>
                    </div>
                    <Button type="button" variant="outline" onClick={async () => {
                        const supabase = createClient()
                        await supabase.auth.signOut()
                        router.push("/login")
                    }} className="w-full md:w-auto h-12 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair do Sistema
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
