"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Calendar as CalendarIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import {
    MaintenanceEvent,
    maintenanceEventSchema,
    MaintenanceEventSchema
} from "@/lib/schemas-equipment"
import { createMaintenanceEvent, updateMaintenanceEvent } from "@/app/dashboard/equipments/maintenance-actions"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

interface MaintenanceModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    equipmentId: string
    eventToEdit?: MaintenanceEvent
}

export function MaintenanceModal({ open, onOpenChange, equipmentId, eventToEdit }: MaintenanceModalProps) {
    const { toast } = useToast()
    const [isPending, setIsPending] = useState(false)

    const form = useForm<MaintenanceEventSchema>({
        resolver: zodResolver(maintenanceEventSchema),
        defaultValues: {
            equipment_id: equipmentId,
            status: "SCHEDULED",
            type: "PREVENTIVE",
            cost: 0,
            hour_meter: 0,
            description: "",
            date: new Date().toISOString().split('T')[0] // today YYYY-MM-DD
        },
    })

    useEffect(() => {
        if (open) {
            if (eventToEdit) {
                form.reset({
                    id: eventToEdit.id,
                    equipment_id: eventToEdit.equipment_id,
                    date: typeof eventToEdit.date === 'string' ? eventToEdit.date.split('T')[0] : format(eventToEdit.date, 'yyyy-MM-dd'),
                    type: eventToEdit.type as any,
                    status: eventToEdit.status as any,
                    hour_meter: Number(eventToEdit.hour_meter),
                    cost: Number(eventToEdit.cost),
                    description: eventToEdit.description || ""
                })
            } else {
                form.reset({
                    equipment_id: equipmentId,
                    status: "SCHEDULED",
                    type: "PREVENTIVE",
                    cost: 0,
                    hour_meter: 0,
                    description: "",
                    date: new Date().toISOString().split('T')[0]
                })
            }
        }
    }, [open, eventToEdit, equipmentId, form])

    const onSubmit = async (data: MaintenanceEventSchema) => {
        setIsPending(true)
        try {
            const result = eventToEdit
                ? await updateMaintenanceEvent(eventToEdit.id, data)
                : await createMaintenanceEvent(data)

            if (result.error) {
                toast({ variant: "destructive", title: "Erro", description: result.error })
            } else {
                toast({ title: "Sucesso", description: `Manutenção ${eventToEdit ? "atualizada" : "registrada"}.` })
                onOpenChange(false)
            }
        } catch (error) {
            console.error(error)
            toast({ variant: "destructive", title: "Erro", description: "Ocorreu um erro inesperado." })
        } finally {
            setIsPending(false)
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
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] rounded-3xl p-8">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-slate-800">
                        {eventToEdit ? "Editar Manutenção" : "Registrar Manutenção"}
                    </DialogTitle>
                    <DialogDescription className="text-lg text-slate-500">
                        Preencha os detalhes da intervenção técnica.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6 mt-4">

                        <div className="grid grid-cols-2 gap-6">
                            <FormField control={form.control} name="date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-slate-700">Data</FormLabel>
                                    <FormControl>
                                        <Input type="date" className="h-12 text-lg" {...field} value={field.value as string} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="hour_meter" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-slate-700">Horímetro na Parada</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.1" className="h-12 text-lg" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value)} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <FormField control={form.control} name="type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-slate-700">Tipo</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-12 text-lg">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="PREVENTIVE">Preventiva</SelectItem>
                                            <SelectItem value="CORRECTIVE">Corretiva</SelectItem>
                                            <SelectItem value="REVISION">Revisão</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="status" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-slate-700">Status</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-12 text-lg">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="SCHEDULED">Agendada</SelectItem>
                                            <SelectItem value="IN_PROGRESS">Em Andamento</SelectItem>
                                            <SelectItem value="COMPLETED">Concluída</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="cost" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-slate-700">Custo Total (Peças + Serviço)</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                                        <Input type="number" step="0.01" className="h-12 text-lg pl-10" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value)} />
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-slate-700">Descrição / Observações</FormLabel>
                                <FormControl>
                                    <Textarea className="min-h-[100px] text-lg p-3 rounded-xl resize-none" placeholder="Descreva o serviço realizado..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-12 px-6 rounded-xl font-bold text-slate-500 hover:bg-slate-100">
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending} className="h-12 px-8 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20">
                                {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                                Salvar Registro
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
