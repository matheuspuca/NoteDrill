"use client"

import { useState, useMemo } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, FileText, Activity, Fuel, Plus, Trash2, HardHat, Check } from "lucide-react"
import { format } from "date-fns"

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
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

import { bdpSchema, BDPSchema, serviceTypeSchema, occurrenceTypeSchema, supplyTypeSchema } from "@/lib/schemas-bdp"
import { createBDP } from "@/app/dashboard/bdp/actions"
import { BDPServiceSection } from "./BDPServiceSection"

interface BDPFormProps {
    projects: { id: string, name: string }[]
    teamMembers: { id: string, name: string, role: string }[]
    equipments: { id: string, name: string, type: string }[]
}

export function BDPForm({ projects, teamMembers, equipments }: BDPFormProps) {
    const { toast } = useToast()
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Filter lists
    const drills = equipments.filter(e => e.type === 'Hidráulica' || e.type === 'Pneumática' || !e.type)
    const compressors = equipments.filter(e => e.type === 'Compressor')
    const serviceTypes = Object.values(serviceTypeSchema.Values)
    const occurrenceTypes = Object.values(occurrenceTypeSchema.Values)
    const supplyTypes = Object.values(supplyTypeSchema.Values)

    const form = useForm<BDPSchema>({
        resolver: zodResolver(bdpSchema),
        defaultValues: {
            // Header
            shift: undefined,
            date: format(new Date(), "yyyy-MM-dd"),
            projectId: "",
            operatorId: "",
            drillId: "",

            // Params
            hourmeterStart: 0,
            hourmeterEnd: 0,

            // Arrays
            services: [],
            occurrences: [],
            supplies: [],
            // Legacy/Flattened
            holes: [],
        },
    })

    // Field Arrays
    const { fields: serviceFields, append: appendService, remove: removeService } = useFieldArray({
        control: form.control,
        name: "services",
    })

    const { fields: occFields, append: appendOcc, remove: removeOcc } = useFieldArray({
        control: form.control,
        name: "occurrences",
    })
    const { fields: supplyFields, append: appendSupply, remove: removeSupply } = useFieldArray({
        control: form.control,
        name: "supplies",
    })

    // Watchers for Calculations
    const services = form.watch("services")
    const hourStart = form.watch("hourmeterStart")
    const hourEnd = form.watch("hourmeterEnd")

    // Update Totals (Memoized or Effect)
    const stats = useMemo(() => {
        let totalMeters = 0
        let totalHoles = 0

        services?.forEach(s => {
            s.holes?.forEach(h => {
                totalMeters += (Number(h.depth) || 0)
                totalHoles += 1
            })
        })

        const avgHeight = totalHoles ? totalMeters / totalHoles : 0
        const totalHours = (Number(hourEnd) || 0) - (Number(hourStart) || 0)

        return { totalMeters, avgHeight, totalHours }
    }, [services, hourStart, hourEnd])

    const handleAddService = (type: string) => {
        // Prevent dupes? User requirement allows mulitple services, maybe multiple of same type? Assume unique type for now.
        const exists = serviceFields.find(s => s.serviceType === type)
        if (exists) {
            toast({ title: "Serviço já adicionado", description: "Edite a seção existente." })
            return
        }
        appendService({
            serviceType: type as any,
            holeCount: 0,
            holes: []
        })
    }

    async function onSubmit(data: BDPSchema) {
        setIsSubmitting(true)

        // Flatten services into holes or Keep structured?
        // Let's flatten for DB compatibility if the backend expects "holes".
        // Also populate the calculated stats fields
        data.totalMeters = stats.totalMeters
        data.totalHours = stats.totalHours
        data.averageHeight = stats.avgHeight

        // If we want to save all holes in the main array:
        const allHoles: any[] = []
        data.services?.forEach(s => {
            s.holes?.forEach(h => {
                // Attach service type and header params to the hole
                // We map service-level inputs to the individual hole for the backend/legacy support
                allHoles.push({
                    ...h,
                    serviceType: s.serviceType,
                    diameter: s.diameter,
                    azimuth: s.azimuth,
                    // Store mesh info for reconstruction
                    meshLength: s.meshLength,
                    meshWidth: s.meshWidth,
                })
            })
        })

        // We assign to legacy 'holes' just in case existing logic uses it
        data.holes = allHoles

        try {
            const result = await createBDP(data)

            if (result.error) {
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: result.error,
                })
            } else {
                toast({

                    title: "Sucesso!",
                    description: "BDP criado com sucesso.",
                })
                router.push("/dashboard/bdp")
            }
        } catch (error) {
            console.error(error)
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Erro inesperado.",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">

                {/* 1. HEADER & RELATIONS */}
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2.5 rounded-xl"><FileText className="w-6 h-6 text-blue-600" /></div>
                        <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wider">Dados Principais</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField control={form.control} name="date" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-slate-700">Data</FormLabel>
                                <FormControl><Input type="date" className="h-14 bg-slate-50 border-slate-200 rounded-xl" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="shift" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-slate-700">Turno</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="Diurno">☀️ Diurno</SelectItem>
                                        <SelectItem value="Noturno">🌙 Noturno</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="projectId" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-slate-700">Obra / Projeto</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl"><SelectValue placeholder="Selecione a Obra" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {projects.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <FormField control={form.control} name="drillId" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-slate-700">Perfuratriz</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {drills.map(d => (
                                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="compressorId" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-slate-700">Compressor (Opcional)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl"><SelectValue placeholder="Nenhum" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {compressors.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="operatorId" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-slate-700">Operador</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {teamMembers.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.name} <span className="text-slate-400 text-xs">({t.role})</span></SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="helperId" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-slate-700">Ajudante (Opcional)</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {teamMembers.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.name} <span className="text-slate-400 text-xs">({t.role})</span></SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                    </div>

                    {/* Geology Header */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-100">
                        <FormField control={form.control} name="materialDescription" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-slate-700">Descrição do Material / Rocha</FormLabel>
                                <FormControl><Input placeholder="Ex: Basalto, Sedimento" className="bg-slate-50 rounded-xl" {...field} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="lithologyProfile" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-slate-700">Perfil Litológico</FormLabel>
                                <FormControl><Input placeholder="Detalhes da camada..." className="bg-slate-50 rounded-xl" {...field} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="penetrationTime" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-slate-700">Tempo de Penetração</FormLabel>
                                <FormControl><Input placeholder="Ex: 20m/h" className="bg-slate-50 rounded-xl" {...field} /></FormControl>
                            </FormItem>
                        )} />
                    </div>
                </div>

                {/* 2. SERVICES & HOLES */}
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-100 p-2.5 rounded-xl"><HardHat className="w-6 h-6 text-purple-600" /></div>
                            <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wider">Serviços Executados</h3>
                        </div>
                    </div>

                    {/* Service Selector */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <span className="text-sm font-bold text-slate-500 uppercase block mb-3">Adicionar Serviço:</span>
                        <div className="flex flex-wrap gap-2">
                            {serviceTypes.map(type => {
                                const isActive = serviceFields.some(s => s.serviceType === type)
                                return (
                                    <Badge
                                        key={type}
                                        variant={isActive ? "default" : "outline"}
                                        className={`cursor-pointer text-sm py-2 px-4 rounded-lg transition-all ${isActive ? 'bg-purple-600 hover:bg-purple-700' : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-600'}`}
                                        onClick={() => handleAddService(type)}
                                    >
                                        {isActive && <Check className="w-3 h-3 mr-2" />}
                                        {type}
                                    </Badge>
                                )
                            })}
                        </div>
                    </div>

                    {/* Service Sections */}
                    <div className="space-y-8">
                        {serviceFields.map((field, index) => (
                            <BDPServiceSection
                                key={field.id}
                                control={form.control}
                                register={form.register}
                                watch={form.watch}
                                index={index}
                                serviceType={field.serviceType}
                                onRemoveService={removeService}
                            />
                        ))}

                        {serviceFields.length === 0 && (
                            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                                Selecione um serviço acima para começar os apontamentos.
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. OCCURRENCES */}
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-100 p-2.5 rounded-xl"><Activity className="w-6 h-6 text-red-600" /></div>
                            <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wider">Paradas e Ocorrências</h3>
                        </div>
                        <Button type="button" onClick={() => appendOcc({ type: "Outros", timeStart: "00:00", timeEnd: "00:00" })} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                            <Plus className="mr-2 h-4 w-4" /> Adicionar Ocorrência
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {occFields.map((field, index) => (
                            <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100 relative">
                                <FormField control={form.control} name={`occurrences.${index}.type`} render={({ field }) => (
                                    <FormItem className="md:col-span-1">
                                        <FormLabel className="font-bold text-xs uppercase">Tipo</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {occurrenceTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name={`occurrences.${index}.timeStart`} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-xs uppercase">Início</FormLabel>
                                        <FormControl><Input type="time" className="bg-white" {...field} /></FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name={`occurrences.${index}.timeEnd`} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-xs uppercase">Fim</FormLabel>
                                        <FormControl><Input type="time" className="bg-white" {...field} /></FormControl>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name={`occurrences.${index}.description`} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-bold text-xs uppercase">Obs. Técnica</FormLabel>
                                        <FormControl><Input placeholder="Detalhes..." className="bg-white" {...field} /></FormControl>
                                    </FormItem>
                                )} />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeOcc(index)} className="absolute top-2 right-2 text-red-400 hover:text-red-500">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. SUPPLIES */}
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-yellow-100 p-2.5 rounded-xl"><Fuel className="w-6 h-6 text-yellow-600" /></div>
                            <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wider">Abastecimento e Insumos</h3>
                        </div>
                        <Button type="button" onClick={() => appendSupply({ type: "Diesel (L)", quantity: 0 })} variant="outline" className="text-yellow-600 border-yellow-200 hover:bg-yellow-50">
                            <Plus className="mr-2 h-4 w-4" /> Adicionar Insumo
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {supplyFields.map((field, index) => (
                            <div key={field.id} className="flex gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <FormField control={form.control} name={`supplies.${index}.type`} render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel className="font-bold text-xs uppercase">Material</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger className="bg-white"><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {supplyTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name={`supplies.${index}.quantity`} render={({ field }) => (
                                    <FormItem className="w-32">
                                        <FormLabel className="font-bold text-xs uppercase">Quantidade</FormLabel>
                                        <FormControl><Input type="number" step="0.1" className="bg-white" {...field} /></FormControl>
                                    </FormItem>
                                )} />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeSupply(index)} className="text-red-400 hover:text-red-500">
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 5. METRICS */}
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-cyan-100 p-2.5 rounded-xl"><HardHat className="w-6 h-6 text-cyan-600" /></div>
                        <h3 className="font-bold text-slate-800 text-lg uppercase tracking-wider">Resumo Diário</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField control={form.control} name="hourmeterStart" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-slate-700">Horímetro Inicial</FormLabel>
                                <FormControl><Input type="number" step="0.1" className="h-14 bg-slate-50 border-slate-200 rounded-xl" {...field} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="hourmeterEnd" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-slate-700">Horímetro Final</FormLabel>
                                <FormControl><Input type="number" step="0.1" className="h-14 bg-slate-50 border-slate-200 rounded-xl" {...field} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="startTime" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-slate-700">Hora Início</FormLabel>
                                <FormControl><Input type="time" className="h-14 bg-slate-50 border-slate-200 rounded-xl" {...field} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="endTime" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-slate-700">Hora Fim</FormLabel>
                                <FormControl><Input type="time" className="h-14 bg-slate-50 border-slate-200 rounded-xl" {...field} /></FormControl>
                            </FormItem>
                        )} />
                    </div>

                    <Separator />

                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
                            <span className="block text-3xl font-black text-blue-700">{stats.totalMeters.toFixed(1)}m</span>
                            <span className="text-xs font-bold uppercase text-blue-400">Total Perfurado</span>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-center">
                            <span className="block text-3xl font-black text-purple-700">{stats.avgHeight.toFixed(1)}m</span>
                            <span className="text-xs font-bold uppercase text-purple-400">Média (Prof/Furo)</span>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                            <span className="block text-3xl font-black text-slate-700">{stats.totalHours.toFixed(1)}h</span>
                            <span className="text-xs font-bold uppercase text-slate-400">Total Horas</span>
                        </div>
                    </div>
                </div>

                <div className="pt-8 pb-20 sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 -mx-4 px-4 sm:-mx-8 sm:px-8 z-20">
                    <Button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 hover:bg-blue-700 text-white h-16 rounded-2xl text-xl font-bold shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.01]">
                        {isSubmitting && <Loader2 className="mr-3 h-6 w-6 animate-spin" />}
                        Finalizar e Salvar BDP
                    </Button>
                </div>

            </form>
        </Form>
    )
}
