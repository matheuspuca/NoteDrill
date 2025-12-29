"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Save, Upload, Building2 } from "lucide-react"
import { CompanySettingsSchema, companySettingsSchema } from "@/lib/schemas-settings"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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
import Image from "next/image"

import { updateCompanySettings } from "@/app/dashboard/settings/actions"

export function CompanySettingsForm({ initialData }: { initialData?: any }) {
    const { toast } = useToast()
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)
    const [logoUrl, setLogoUrl] = useState<string | null>(initialData?.logo_url || null)
    const [uploading, setUploading] = useState(false)

    const form = useForm<CompanySettingsSchema>({
        resolver: zodResolver(companySettingsSchema),
        defaultValues: {
            company_name: initialData?.company_name || "",
            cnpj: initialData?.cnpj || "",
            address: initialData?.address || "",
            email: initialData?.email || "",
            phone: initialData?.phone || "",
            website: initialData?.website || "",
        },
    })



    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)
            const file = event.target.files?.[0]
            if (!file) return

            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Usuário não logado")

            const fileExt = file.name.split('.').pop()
            const filePath = `${user.id}-${Math.random()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('company-logos')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('company-logos')
                .getPublicUrl(filePath)

            setLogoUrl(publicUrl)
            toast({ title: "Logo atualizada", description: "Nova logo enviada com sucesso." })
        } catch (error: any) {
            toast({ variant: "destructive", title: "Erro no upload", description: error.message })
        } finally {
            setUploading(false)
        }
    }

    const onSubmit = async (data: CompanySettingsSchema) => {
        setIsPending(true)

        const result = await updateCompanySettings({
            ...data,
            logo_url: logoUrl
        })

        if (result.error) {
            console.error("Erro ao salvar empresa:", result.error)
            toast({ variant: "destructive", title: "Erro ao salvar", description: result.error })
        } else {
            toast({ title: "Sucesso", description: "Configurações da empresa salvas." })
            router.refresh()
        }

        setIsPending(false)
    }



    return (
        <Card className="border-none shadow-lg bg-white rounded-2xl ring-1 ring-slate-100">
            <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-blue-600" />
                    Dados da Empresa
                </CardTitle>
                <CardDescription className="text-base text-slate-500">Informações exibidas em relatórios e no sistema.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                        console.error("Erros de validação:", errors)
                        toast({ variant: "destructive", title: "Erro de Validação", description: "Verifique os campos obrigatórios." })
                    })} className="space-y-6">

                        {/* Logo Upload */}
                        <div className="flex items-center gap-6 p-4 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                            <div className="relative w-24 h-24 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden group">
                                {logoUrl ? (
                                    <Image src={logoUrl} alt="Logo" fill className="object-cover" sizes="100px" />
                                ) : (
                                    <Building2 className="w-10 h-10 text-slate-300" />
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-slate-700 mb-1">Logomarca</h4>
                                <p className="text-xs text-slate-500 mb-3">Recomendado: PNG ou JPG, min. 200x200px.</p>
                                <div className="flex items-center gap-2">
                                    <label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center justify-center h-9 px-4 text-sm font-medium bg-white border border-slate-200 shadow-sm hover:bg-slate-50 rounded-lg text-slate-700 transition-colors">
                                        <Upload className="w-4 h-4 mr-2" />
                                        {logoUrl ? "Trocar Logo" : "Fazer Upload"}
                                    </label>
                                    <input
                                        id="logo-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleLogoUpload}
                                        disabled={uploading}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="company_name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-lg font-semibold text-slate-700">Razão Social / Nome Fantasia</FormLabel>
                                    <FormControl><Input className="h-14 text-lg" placeholder="Ex: SmartDrill Engenharia" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="cnpj" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-lg font-semibold text-slate-700">CNPJ</FormLabel>
                                    <FormControl><Input className="h-14 text-lg" placeholder="00.000.000/0000-00" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-lg font-semibold text-slate-700">Email Comercial</FormLabel>
                                    <FormControl><Input className="h-14 text-lg" placeholder="contato@empresa.com" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-lg font-semibold text-slate-700">Telefone / WhatsApp</FormLabel>
                                    <FormControl><Input className="h-14 text-lg" placeholder="(00) 00000-0000" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-lg font-semibold text-slate-700">Endereço Completo</FormLabel>
                                <FormControl><Input className="h-14 text-lg" placeholder="Rua, Número, Bairro, Cidade - UF" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="website" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-lg font-semibold text-slate-700">Website</FormLabel>
                                <FormControl><Input className="h-14 text-lg" placeholder="https://..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 h-14 px-10 text-lg">
                                {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                                Salvar Alterações
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
