"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { equipmentSchema, EquipmentSchema, Equipment } from "@/lib/schemas-equipment"
import { createEquipment, updateEquipment } from "@/app/dashboard/equipments/actions"

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
import { useToast } from "@/components/ui/use-toast"

interface EquipmentFormProps {
    equipment?: Equipment
}

export function EquipmentForm({ equipment }: EquipmentFormProps) {
    const { toast } = useToast()
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)

    const form = useForm<EquipmentSchema>({
        resolver: zodResolver(equipmentSchema),
        defaultValues: {
            internalCode: equipment?.internalCode || "",
            name: equipment?.name || "",
            type: (equipment?.type as any) || "Hidráulica",
            model: equipment?.model || "",
            manufacturer: equipment?.manufacturer || "",
            year: Number(equipment?.year) || new Date().getFullYear(),
            chassis: equipment?.chassis || "",
            status: (equipment?.status as any) || "Operacional",
            hourmeter: Number(equipment?.hourmeter) || 0,
            maintenanceInterval: Number(equipment?.maintenanceInterval) || 250,
            compressorDetails: equipment?.compressorDetails || {
                brand: "",
                model: "",
                year: 0,
                serialNumber: "",
                hourmeter: 0
            }
        },
    })

    const type = form.watch("type")

    const onSubmit = async (data: EquipmentSchema) => {
        setIsPending(true)
        console.log("Submitting form data:", data) // Debug
        try {
            const result = equipment
                ? await updateEquipment(equipment.id, data)
                : await createEquipment(data)

            if (result.error) {
                console.error("Action Error:", result.error)
                toast({
                    variant: "destructive",
                    title: "Erro ao Salvar",
                    description: result.error,
                })
            } else {
                toast({
                    title: "Sucesso",
                    description: `Equipamento ${equipment ? "atualizado" : "criado"} com sucesso.`,
                })
                router.refresh()
                router.push("/dashboard/equipments")
            }
        } catch (error) {
            console.error("Submission Exception:", error)
            toast({
                variant: "destructive",
                title: "Erro Inesperado",
                description: "Ocorreu um erro ao processar sua solicitação.",
            })
        } finally {
            setIsPending(false)
        }
    }

    const onError = (errors: any) => {
        console.error("Validation Errors:", errors)
        const missingFields = Object.keys(errors).map(key => {
            // Translate common keys if needed or just show key
            return key
        }).join(", ")

        toast({
            variant: "destructive",
            title: "Verifique os Campos",
            description: `Erros nos campos: ${missingFields}. Verifique preenchimento.`,
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8">
                {Object.keys(form.formState.errors).length > 0 && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
                        <Loader2 className="h-5 w-5 text-red-500 animate-pulse" />
                        <div>
                            <p className="font-bold">Existem erros no formulário.</p>
                            <p className="text-sm">Por favor, corrija os campos em vermelho antes de salvar.</p>
                        </div>
                    </div>
                )}

                {/* Core Info */}
                <div className="space-y-6">
                    <h3 className="text-2xl font-black text-slate-800 border-b pb-2">Dados Principais</h3>

                    <div className="grid grid-cols-2 gap-8">
                        <FormField control={form.control} name="internalCode" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xl font-bold text-slate-700">Código Interno</FormLabel>
                                <FormControl><Input className="h-16 text-xl font-medium" placeholder="EX: PF-001" {...field} /></FormControl>
                                <FormMessage className="text-lg" />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="type" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xl font-bold text-slate-700">Tipo de Equipamento</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-16 text-xl font-medium">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem className="text-xl font-medium py-3" value="Hidráulica">Perfuratriz Hidráulica</SelectItem>
                                        <SelectItem className="text-xl font-medium py-3" value="Pneumática">Perfuratriz Pneumática</SelectItem>
                                        <SelectItem className="text-xl font-medium py-3" value="Compressor">Compressor</SelectItem>
                                        <SelectItem className="text-xl font-medium py-3" value="Veículo">Veículo / Caminhão</SelectItem>
                                        <SelectItem className="text-xl font-medium py-3" value="Outros">Outros</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage className="text-lg" />
                            </FormItem>
                        )} />
                    </div>

                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xl font-bold text-slate-700">Nome / Identificação</FormLabel>
                            <FormControl><Input className="h-16 text-xl font-medium" placeholder="Ex: R-01" {...field} /></FormControl>
                            <FormMessage className="text-lg" />
                        </FormItem>
                    )} />

                    <div className="grid grid-cols-2 gap-8">
                        <FormField control={form.control} name="manufacturer" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xl font-bold text-slate-700">Fabricante</FormLabel>
                                <FormControl><Input className="h-16 text-xl font-medium" placeholder="Marca" {...field} /></FormControl>
                                <FormMessage className="text-lg" />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="model" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xl font-bold text-slate-700">Modelo</FormLabel>
                                <FormControl><Input className="h-16 text-xl font-medium" placeholder="Modelo" {...field} /></FormControl>
                                <FormMessage className="text-lg" />
                            </FormItem>
                        )} />
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <FormField control={form.control} name="year" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xl font-bold text-slate-700">Ano Fab.</FormLabel>
                                <FormControl><Input className="h-16 text-xl font-medium" type="number" {...field} value={field.value || ''} onChange={(e) => field.onChange(e.target.value)} /></FormControl>
                                <FormMessage className="text-lg" />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="chassis" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xl font-bold text-slate-700">Série / Chassi <span className="text-slate-400 font-normal text-base">(Opcional)</span></FormLabel>
                                <FormControl><Input className="h-16 text-xl font-medium" placeholder="Número de Série" {...field} /></FormControl>
                                <FormMessage className="text-lg" />
                            </FormItem>
                        )} />
                    </div>
                </div>

                <Separator className="my-8" />

                {/* Status & Maintenance */}
                <div className="space-y-6">
                    <h3 className="text-2xl font-black text-slate-800 border-b pb-2">Status e Manutenção</h3>
                    <div className="grid grid-cols-3 gap-8">
                        <FormField control={form.control} name="status" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xl font-bold text-slate-700">Status Atual</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="bg-slate-50 h-16 text-xl font-medium">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem className="text-xl font-medium py-3" value="Operacional">Operacional</SelectItem>
                                        <SelectItem className="text-xl font-medium py-3" value="Manutenção">Em Manutenção</SelectItem>
                                        <SelectItem className="text-xl font-medium py-3" value="Indisponível">Indisponível</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage className="text-lg" />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="hourmeter" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xl font-bold text-slate-700">Horímetro Atual</FormLabel>
                                <FormControl><Input className="h-16 text-xl font-medium" type="number" step="0.1" {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} /></FormControl>
                                <FormMessage className="text-lg" />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="maintenanceInterval" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xl font-bold text-slate-700">Manutenção a cada (h)</FormLabel>
                                <FormControl><Input className="h-16 text-xl font-medium" type="number" {...field} /></FormControl>
                                <FormMessage className="text-lg" />
                            </FormItem>
                        )} />
                    </div>
                </div>

                {/* Conditional Fields for Pneumatic Drill (Compressor Details) */}
                {type === "Pneumática" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <Separator className="my-8" />
                        <div className="bg-blue-50 p-8 rounded-2xl border-2 border-blue-100">
                            <h3 className="text-2xl font-black text-blue-800 mb-8 flex items-center gap-3">
                                <span className="bg-blue-200 text-blue-700 px-3 py-1 rounded-lg text-sm uppercase">Anexo</span>
                                Dados do Compressor Acoplado
                            </h3>

                            <div className="grid grid-cols-2 gap-8">
                                <FormField control={form.control} name="compressorDetails.brand" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-blue-900 text-xl font-bold">Marca do Compressor</FormLabel>
                                        <FormControl><Input className="bg-white border-blue-200 h-16 text-xl font-medium" placeholder="Ex: Atlas Copco" {...field} /></FormControl>
                                        <FormMessage className="text-lg" />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="compressorDetails.model" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-blue-900 text-xl font-bold">Modelo do Compressor</FormLabel>
                                        <FormControl><Input className="bg-white border-blue-200 h-16 text-xl font-medium" placeholder="Ex: XAS 186" {...field} /></FormControl>
                                        <FormMessage className="text-lg" />
                                    </FormItem>
                                )} />
                            </div>
                            <div className="grid grid-cols-3 gap-8 mt-8">
                                <FormField control={form.control} name="compressorDetails.year" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-blue-900 text-xl font-bold">Ano</FormLabel>
                                        <FormControl><Input type="number" className="bg-white border-blue-200 h-16 text-xl font-medium" {...field} /></FormControl>
                                        <FormMessage className="text-lg" />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="compressorDetails.serialNumber" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-blue-900 text-xl font-bold">Nº Série</FormLabel>
                                        <FormControl><Input className="bg-white border-blue-200 h-16 text-xl font-medium" {...field} /></FormControl>
                                        <FormMessage className="text-lg" />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="compressorDetails.hourmeter" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-blue-900 text-xl font-bold">Horímetro</FormLabel>
                                        <FormControl><Input type="number" step="0.1" className="bg-white border-blue-200 h-16 text-xl font-medium" {...field} /></FormControl>
                                        <FormMessage className="text-lg" />
                                    </FormItem>
                                )} />
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-8 flex justify-end gap-3">
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-xl h-16 px-10 rounded-2xl font-black shadow-xl shadow-blue-600/20"
                    >
                        {isPending && <Loader2 className="mr-2 h-6 w-6 animate-spin" />}
                        {equipment ? "Salvar Alterações" : "Cadastrar Equipamento"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
