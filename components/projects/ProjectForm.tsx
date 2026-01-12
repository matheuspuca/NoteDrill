"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Calendar as CalendarIcon, MapPin, Building2, User, Phone, Box } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { projectSchema, ProjectSchema, Project } from "@/lib/schemas-project"
import { createProject, updateProject } from "@/app/dashboard/projects/actions"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface ProjectFormProps {
    project?: Project
    onSuccess?: () => void
}

export function ProjectForm({ project, onSuccess }: ProjectFormProps) {
    const { toast } = useToast()
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<ProjectSchema>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            name: project?.name || "",
            address: project?.address || "",
            city: project?.city || "",
            zip_code: project?.zip_code || "",
            responsible_engineer: project?.responsible_engineer || "",
            responsible_phone: project?.responsible_phone || "",
            status: (project?.status as any) || "Planejamento",
            volume_m3: project?.volume_m3 || 0,
            start_date: project?.start_date || "",
            end_date: project?.end_date || "",
            contract_number: project?.contract_number || "",
            payroll_estimate: project?.payroll_estimate || 0,
            price_per_m3: project?.price_per_m3 || 0,
            mob_demob_cost: project?.mob_demob_cost || 0,
            tax_rate: project?.tax_rate || 0,
        },
    })

    async function onSubmit(data: ProjectSchema) {
        setIsSubmitting(true)
        try {
            let result
            if (project) {
                result = await updateProject(project.id, data)
            } else {
                result = await createProject(data)
            }

            if (result.error) {
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: result.error,
                })
            } else {
                toast({

                    title: "Sucesso!",
                    description: project ? "Projeto atualizado com sucesso." : "Novo projeto criado com sucesso.",
                })
                if (onSuccess) {
                    onSuccess()
                } else {
                    router.push("/dashboard/projects")
                }
            }
        } catch (error) {
            console.error(error)
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Ocorreu um erro inesperado.",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    function onInvalid(errors: any) {
        console.error("Form Validation Errors:", errors)
        toast({
            variant: "destructive",
            title: "Erro de Validação",
            description: "Verifique os campos obrigatórios: " + Object.keys(errors).join(", "),
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-10">

                {/* Section: Basic Info */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-100 p-2.5 rounded-xl">
                            <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wider">Dados Principais</h3>
                    </div>

                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 font-bold text-lg">Nome da Obra <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Residencial Alphaville..." className="h-14 text-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl px-4" {...field} />
                                </FormControl>
                                <FormMessage className="text-base" />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="contract_number"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 font-bold text-lg">Número do Contrato</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: CTR-2024/001" className="h-14 text-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl px-4" {...field} />
                                    </FormControl>
                                    <FormMessage className="text-base" />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 font-bold text-lg">Status Atual <span className="text-red-500">*</span></FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-14 text-lg border-slate-200 rounded-xl px-4">
                                                <SelectValue placeholder="Selecione o status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Planejamento" className="text-lg py-3">🔵 Planejamento</SelectItem>
                                            <SelectItem value="Produção" className="text-lg py-3">🟢 Em Produção</SelectItem>
                                            <SelectItem value="Parada" className="text-lg py-3">🔴 Parada</SelectItem>
                                            <SelectItem value="Concluída" className="text-lg py-3">⚪ Concluída</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-base" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="volume_m3"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 font-bold text-lg">Volume (m³)</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Box className="absolute left-4 top-4 h-6 w-6 text-slate-400" />
                                            <Input type="number" step="0.01" placeholder="0.00" className="pl-12 h-14 text-lg border-slate-200 rounded-xl" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-base" />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* Section: Location */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-orange-100 p-2.5 rounded-xl">
                            <MapPin className="w-6 h-6 text-orange-600" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wider">Localização</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="zip_code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 font-bold text-lg">CEP</FormLabel>
                                    <FormControl>
                                        <Input placeholder="00000-000" className="h-14 text-lg border-slate-200 rounded-xl px-4" {...field} />
                                    </FormControl>
                                    <FormMessage className="text-base" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 font-bold text-lg">Cidade/UF <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="São Paulo" className="h-14 text-lg border-slate-200 rounded-xl px-4" {...field} />
                                    </FormControl>
                                    <FormMessage className="text-base" />
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 font-bold text-lg">Endereço Completo <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                    <Input placeholder="Av. Principal, 1000 - Centro" className="h-14 text-lg border-slate-200 rounded-xl px-4" {...field} />
                                </FormControl>
                                <FormMessage className="text-base" />
                            </FormItem>
                        )}
                    />
                </div>

                <Separator className="bg-slate-100" />

                {/* Section: Contact & Dates */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-green-100 p-2.5 rounded-xl">
                            <User className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wider">Responsável & Prazos</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="responsible_engineer"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 font-bold text-lg">Engenheiro Responsável</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <User className="absolute left-4 top-4 h-6 w-6 text-slate-400" />
                                            <Input placeholder="João Silva" className="pl-12 h-14 text-lg border-slate-200 rounded-xl" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-base" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="responsible_phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 font-bold text-lg">Telefone/Contato</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-4 h-6 w-6 text-slate-400" />
                                            <Input placeholder="(11) 99999-9999" className="pl-12 h-14 text-lg border-slate-200 rounded-xl" {...field} />
                                        </div>
                                    </FormControl>
                                    <FormMessage className="text-base" />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="start_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 font-bold text-lg">Início Previsto</FormLabel>
                                    <FormControl>
                                        <Input type="date" className="h-14 text-lg border-slate-200 rounded-xl px-4" {...field} />
                                    </FormControl>
                                    <FormMessage className="text-base" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="end_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 font-bold text-lg">Término Previsto</FormLabel>
                                    <FormControl>
                                        <Input type="date" className="h-14 text-lg border-slate-200 rounded-xl px-4" {...field} />
                                    </FormControl>
                                    <FormMessage className="text-base" />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* Section: Financial */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-emerald-100 p-2.5 rounded-xl">
                            <Box className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wider">Viabilidade Financeira (Opcional)</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="price_per_m3"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 font-bold text-lg">Preço por m³ (R$)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="0.00" className="h-14 text-lg border-slate-200 rounded-xl px-4" {...field} />
                                    </FormControl>
                                    <FormMessage className="text-base" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="tax_rate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 font-bold text-lg">Impostos (%)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.1" placeholder="0.0" className="h-14 text-lg border-slate-200 rounded-xl px-4" {...field} />
                                    </FormControl>
                                    <FormMessage className="text-base" />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                            control={form.control}
                            name="payroll_estimate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 font-bold text-lg">Folha Mensal Est. (R$)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="0.00" className="h-14 text-lg border-slate-200 rounded-xl px-4" {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="mob_demob_cost"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 font-bold text-lg">Custo Mob/Demob (R$)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="0.00" className="h-14 text-lg border-slate-200 rounded-xl px-4" {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="pt-6">
                    <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-16 rounded-xl text-xl font-bold shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02]">
                        {isSubmitting && <Loader2 className="mr-3 h-6 w-6 animate-spin" />}
                        {project ? "Salvar Alterações" : "Criar Novo Projeto"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
