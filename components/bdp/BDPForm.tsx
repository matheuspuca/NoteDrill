"use client"

import { useState, useMemo } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, FileText, Activity, Fuel, Plus, Trash2, HardHat, Check, Flame } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
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
import { useRouter, useSearchParams } from "next/navigation"

import { bdpSchema, BDPSchema, serviceTypeSchema, occurrenceTypeSchema, supplyTypeSchema } from "@/lib/schemas-bdp"
import { createBDP, updateBDP } from "@/app/dashboard/bdp/actions"
import { BDPServiceSection } from "./BDPServiceSection"


interface BDPFormProps {
    projects: { id: string, name: string }[]
    teamMembers: { id: string, name: string, role: string, registrationNumber?: number }[]
    equipments: { id: string, name: string, type: string }[]
    inventoryItems: { id: string, name: string, unit: string }[]
    planos?: { id: string, name: string, project_id: string, status: string }[]
    initialData?: BDPSchema & { id: string, reportNumber?: number }
    defaultValues?: Partial<BDPSchema>
}

export function BDPForm({ projects, teamMembers, equipments, inventoryItems, initialData, defaultValues }: BDPFormProps) {
    const { toast } = useToast()
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Get URL params for auto-selection
    const urlProjectId = searchParams.get("projectId")
    const urlPlanoId = searchParams.get("planoId")

    // Filter lists
    const drills = equipments.filter(e => e.type === 'Hidráulica' || e.type === 'Pneumática' || !e.type)

    const serviceTypes = Object.values(serviceTypeSchema.Values)
    const occurrenceTypes = Object.values(occurrenceTypeSchema.Values).sort((a, b) => a.localeCompare(b))


    // Rock Options
    const rockTypes = [
        "Granito", "Gnaisse", "Basalto", "Calcário", "Itabirito", "Minério de Ferro Friável", "Outros"
    ]
    const rockStatuses = ["Sã", "Fissurada", "Sedimento", "Outros"]

    const defaultVals: BDPSchema = initialData ? {
        ...initialData,
        // Ensure date is string yyyy-MM-dd (avoid timezone shift by forcing T12:00:00)
        date: initialData.date ? format(new Date(initialData.date + 'T12:00:00'), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
    } : {
        // Header
        shift: undefined,
        date: format(new Date(), "yyyy-MM-dd"),
        projectId: urlProjectId || defaultValues?.projectId || "",
        planoDeFogoId: urlPlanoId || defaultValues?.planoDeFogoId || "",
        operatorId: defaultValues?.operatorId || "",
        drillId: defaultValues?.drillId || "",

        // Geology
        materialDescription: "",
        rockStatus: undefined,
        rockStatusReason: "",

        // Params
        hourmeterStart: 0,
        hourmeterEnd: 0,

        // Arrays
        services: [],
        occurrences: [],
        supplies: [],
        // Legacy/Flattened
        holes: [],
        ...defaultValues
    }

    const form = useForm<BDPSchema>({
        resolver: zodResolver(bdpSchema),
        defaultValues: defaultVals,
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

    const occurrences = form.watch("occurrences") // Watch occurrences for real-time UF calc

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

        // UF Calculation
        let totalStoppedHours = 0
        occurrences?.forEach(occ => {
            if (!occ.timeStart || !occ.timeEnd) return
            // Simple diff calculation HH:mm
            const [h1, m1] = occ.timeStart.split(':').map(Number)
            const [h2, m2] = occ.timeEnd.split(':').map(Number)
            const startDec_ = h1 + m1 / 60
            const endDec_ = h2 + m2 / 60
            let diff = endDec_ - startDec_
            if (diff < 0) diff += 24
            totalStoppedHours += diff
        })

        const effectiveHours = Math.max(0, totalHours - totalStoppedHours)
        const uf = totalHours > 0 ? (effectiveHours / totalHours) * 100 : 0

        return { totalMeters, avgHeight, totalHours, uf }
    }, [services, hourStart, hourEnd, occurrences])

    const kpi = useMemo(() => {
        return stats
    }, [stats])

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

        // Populate calculated stats fields
        data.totalMeters = kpi.totalMeters
        data.totalHours = kpi.totalHours
        data.averageHeight = kpi.avgHeight

        // Flatten services into holes if needed by backend (Legacy support)
        const allHoles: any[] = []
        data.services?.forEach(s => {
            s.holes?.forEach(h => {
                allHoles.push({
                    ...h,
                    serviceType: s.serviceType,
                    diameter: s.diameter,
                    azimuth: s.azimuth,
                    meshLength: s.meshLength,
                    meshWidth: s.meshWidth,
                })
            })
        })
        data.holes = allHoles

        try {
            let result;
            if (initialData?.id) {
                result = await updateBDP(initialData.id, data)
            } else {
                result = await createBDP(data)
            }

            if (result.error) {
                toast({
                    variant: "destructive",
                    title: "Erro ao Salvar",
                    description: (
                        <div className="flex flex-col gap-1">
                            <span>Não foi possível salvar o BDP.</span>
                            <span className="text-xs font-mono bg-red-900/10 p-1 rounded opacity-80">
                                {result.error}
                            </span>
                        </div>
                    ),
                    duration: 10000,
                })
            } else {
                toast({
                    title: "Sucesso!",
                    description: initialData?.id ? "BDP atualizado com sucesso!" : "BDP criado com sucesso.",
                })
                router.push("/dashboard/bdp")
            }
        } catch (error: any) {
            console.error(error)
            toast({
                variant: "destructive",
                title: "Erro",
                description: `Erro inesperado: ${error?.message || ""}`,
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const onError = (errors: any) => {
        console.error("Form errors:", errors)
        toast({
            variant: "destructive",
            title: "Erro de Validação",
            description: "Verifique os campos obrigatórios: " + Object.keys(errors).join(", "),
        })
    }

    return (
        <div className="space-y-12">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-8">

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
                                    <Select onValueChange={(val) => {
                                        field.onChange(val)
                                        form.setValue("planoDeFogoId", "") // Reset plan on project change
                                    }} defaultValue={field.value}>
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

                            <FormField control={form.control} name="planoDeFogoId" render={({ field }) => {
                                const projectPlans = planos?.filter(p => p.project_id === form.watch("projectId")) || []
                                return (
                                    <FormItem>
                                        <FormLabel className="font-bold text-slate-700 flex items-center gap-1">
                                            <Flame className="w-3 h-3 text-orange-500" />
                                            Plano de Fogo (Opcional)
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || ""}>
                                            <FormControl>
                                                <SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl">
                                                    <SelectValue placeholder={projectPlans.length > 0 ? "Selecione o Plano" : "Sem planos abertos"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="none">Nenhum vínculo</SelectItem>
                                                {projectPlans.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription className="text-[10px]">
                                            Agrupe este BDP em um plano de furação.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )
                            }} />
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



                            <FormField control={form.control} name="operatorId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-slate-700">Operador</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className="h-14 bg-slate-50 border-slate-200 rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {teamMembers.map(t => (
                                                <SelectItem key={t.id} value={t.id}>
                                                    {t.registrationNumber ? <span className="font-mono text-slate-400 mr-2">[{t.registrationNumber}]</span> : null}
                                                    {t.name} <span className="text-slate-400 text-xs">({t.role})</span>
                                                </SelectItem>
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
                                                <SelectItem key={t.id} value={t.id}>
                                                    {t.registrationNumber ? <span className="font-mono text-slate-400 mr-2">[{t.registrationNumber}]</span> : null}
                                                    {t.name} <span className="text-slate-400 text-xs">({t.role})</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                        </div>

                    </div>

                    {/* 1.1 METRICS (Top) */}
                    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 space-y-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-blue-100 p-2 rounded-lg"><Activity className="w-5 h-5 text-blue-600" /></div>
                            <h3 className="font-bold text-slate-800 text-base uppercase tracking-wider">Resumo Diário</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <FormField control={form.control} name="hourmeterStart" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-slate-700 text-xs uppercase">Horímetro Inicial</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.1" className="bg-slate-50 border-slate-200 h-10 font-bold" {...field} />
                                    </FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="hourmeterEnd" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-slate-700 text-xs uppercase">Horímetro Final</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.1" className="bg-slate-50 border-slate-200 h-10 font-bold" {...field} />
                                    </FormControl>
                                </FormItem>
                            )} />
                            {/* Time Inputs similarly compacted */}
                            <FormField control={form.control} name="startTime" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-slate-700 text-xs uppercase">Hora Início</FormLabel>
                                    <FormControl><Input type="time" className="bg-slate-50 border-slate-200 h-10 font-bold" {...field} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="endTime" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-slate-700 text-xs uppercase">Hora Término</FormLabel>
                                    <FormControl><Input type="time" className="bg-slate-50 border-slate-200 h-10 font-bold" {...field} /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                    </div>

                    {/* 1.2 GEOLOGY */}
                    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 space-y-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-orange-100 p-2 rounded-lg"><Activity className="w-5 h-5 text-orange-600" /></div>
                            <h3 className="font-bold text-slate-800 text-base uppercase tracking-wider">Geologia / Rocha</h3>
                        </div>
                        {/* Compacted fields */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="materialDescription" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-slate-700 text-xs uppercase">Tipo de Rocha</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className="h-10 bg-slate-50 border-slate-200"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {rockTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                            {/* ... other geology fields ... */}
                            <FormField control={form.control} name="rockStatus" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-slate-700 text-xs uppercase">Estado da Rocha</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger className="h-10 bg-slate-50 border-slate-200"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {rockStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="lithologyProfile" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-slate-700 text-xs uppercase">Perfil Litológico</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Camada superficial..." className="bg-slate-50 border-slate-200 h-10" {...field} />
                                    </FormControl>
                                </FormItem>
                            )} />
                        </div>
                        {form.watch("rockStatus") === "Outros" && (
                            <FormField control={form.control} name="rockStatusReason" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-slate-700 text-xs uppercase">Detalhe (Outros)</FormLabel>
                                    <FormControl><Input className="bg-white h-10" placeholder="Especifique..." {...field} /></FormControl>
                                </FormItem>
                            )} />
                        )}
                    </div>

                    {/* 2. SERVICES & HOLES */}
                    <div className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100 space-y-5">
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
                        <div className="space-y-5">
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

                    {/* 3. PARADAS/OCORRÊNCIAS */}
                    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-red-100 p-2 rounded-lg"><HardHat className="w-5 h-5 text-red-600" /></div>
                                <h3 className="font-bold text-slate-800 text-base uppercase tracking-wider">Paradas e Ocorrências</h3>
                            </div>
                            <Button type="button" onClick={() => appendOcc({ type: "Outros", timeStart: "00:00", timeEnd: "00:00", description: "" })} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 h-9 text-sm">
                                <Plus className="mr-2 h-3 w-3" /> Adicionar
                            </Button>
                        </div>
                        {/* Compact list */}
                        <div className="space-y-3">
                            {occFields.map((field, index) => (
                                <div key={field.id} className="relative grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-50 p-3 rounded-lg border border-slate-100">

                                    <FormField control={form.control} name={`occurrences.${index}.type`} render={({ field }) => (
                                        <FormItem className="md:col-span-4">
                                            <FormLabel className="font-bold text-xs uppercase">Motivo</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger className="bg-white h-9 text-sm"><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {occurrenceTypes.map((t, idx) => (
                                                        <SelectItem key={t} value={t}>
                                                            <span className="font-mono text-slate-400 mr-2">{idx + 1}.</span>
                                                            {t}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name={`occurrences.${index}.timeStart`} render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="font-bold text-xs uppercase">Início</FormLabel>
                                            <FormControl><Input type="time" className="bg-white h-9 text-sm" {...field} /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name={`occurrences.${index}.timeEnd`} render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel className="font-bold text-xs uppercase">Fim</FormLabel>
                                            <FormControl><Input type="time" className="bg-white h-9 text-sm" {...field} /></FormControl>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name={`occurrences.${index}.description`} render={({ field }) => (
                                        <FormItem className="md:col-span-3">
                                            <FormLabel className="font-bold text-xs uppercase">Obs. Técnica</FormLabel>
                                            <FormControl><Input placeholder="Detalhes..." className="bg-white h-9 text-sm" {...field} /></FormControl>
                                        </FormItem>
                                    )} />
                                    <div className="md:col-span-1 flex justify-end">
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeOcc(index)} className="text-red-400 hover:text-red-500 h-9 w-9">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 4. SUPPLIES */}
                    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-yellow-100 p-2 rounded-lg"><Fuel className="w-5 h-5 text-yellow-600" /></div>
                                <h3 className="font-bold text-slate-800 text-base uppercase tracking-wider">Abastecimento e Insumos</h3>
                            </div>
                            <Button type="button" onClick={() => appendSupply({ type: "Diesel (L)", quantity: 0 })} variant="outline" className="text-yellow-600 border-yellow-200 hover:bg-yellow-50 h-9 text-sm">
                                <Plus className="mr-2 h-3 w-3" /> Adicionar
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {supplyFields.map((field, index) => (
                                <div key={field.id} className="flex gap-4 items-end bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <FormField control={form.control} name={`supplies.${index}.type`} render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormLabel className="font-bold text-xs uppercase">Material</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger className="bg-white h-9 text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {inventoryItems.map(item => (
                                                        <SelectItem key={item.id} value={item.name}>
                                                            {item.name} ({item.unit})
                                                        </SelectItem>
                                                    ))}
                                                    <SelectItem value="Outros">Outros</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name={`supplies.${index}.quantity`} render={({ field }) => (
                                        <FormItem className="w-32">
                                            <FormLabel className="font-bold text-xs uppercase">Quantidade</FormLabel>
                                            <FormControl><Input type="number" inputMode="decimal" step="0.1" className="bg-white h-9 text-sm" {...field} /></FormControl>
                                        </FormItem>
                                    )} />
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeSupply(index)} className="text-red-400 hover:text-red-500 h-9 w-9">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 5. METRICS SUMMARY (KPIs) */}
                    <div className="bg-white p-5 rounded-[24px] shadow-sm border border-slate-100 space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="bg-green-100 p-2 rounded-lg"><Activity className="w-5 h-5 text-green-600" /></div>
                            <h3 className="font-bold text-slate-800 text-base uppercase tracking-wider">Resumo de Performance (KPIs)</h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-center">
                                <span className="block text-2xl font-black text-blue-700">{kpi.totalMeters.toFixed(1)}m</span>
                                <span className="text-[10px] font-bold uppercase text-blue-400">Total Perfurado</span>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-center">
                                <span className="block text-2xl font-black text-purple-700">{kpi.avgHeight.toFixed(1)}m</span>
                                <span className="text-[10px] font-bold uppercase text-purple-400">Média (Prof/Furo)</span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                <span className="block text-2xl font-black text-slate-700">{kpi.totalHours.toFixed(1)}h</span>
                                <span className="text-[10px] font-bold uppercase text-slate-400">Total Horas</span>
                            </div>
                            <div className="p-3 bg-green-50 rounded-xl border border-green-100 text-center">
                                <span className="block text-2xl font-black text-green-700">{kpi.uf.toFixed(0)}%</span>
                                <span className="text-[10px] font-bold uppercase text-green-600">UF (Utilização)</span>
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
            </Form >
        </div>
    )
}
