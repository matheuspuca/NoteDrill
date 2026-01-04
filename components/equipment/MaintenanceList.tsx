"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Plus, Wrench, Calendar, Clock, DollarSign, Activity, Trash2, Edit } from "lucide-react"
import { MaintenanceEvent } from "@/lib/schemas-equipment"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MaintenanceModal } from "./MaintenanceModal"
import { deleteMaintenanceEvent } from "@/app/dashboard/equipments/maintenance-actions"
import { useToast } from "@/components/ui/use-toast"

interface MaintenanceListProps {
    equipmentId: string
    events: MaintenanceEvent[]
}

const statusConfig: Record<string, { label: string; class: string }> = {
    SCHEDULED: { label: "Agendada", class: "bg-slate-100 text-slate-700 border-slate-200" },
    IN_PROGRESS: { label: "Em Andamento", class: "bg-blue-100 text-blue-700 border-blue-200" },
    COMPLETED: { label: "Concluída", class: "bg-green-100 text-green-700 border-green-200" },
}

const typeConfig: Record<string, { label: string; class: string }> = {
    REVISION: { label: "Revisão", class: "bg-indigo-50 text-indigo-700" },
    PREVENTIVE: { label: "Preventiva", class: "bg-emerald-50 text-emerald-700" },
    CORRECTIVE: { label: "Corretiva", class: "bg-rose-50 text-rose-700" },
}

export function MaintenanceList({ equipmentId, events }: MaintenanceListProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState<MaintenanceEvent | undefined>(undefined)
    const { toast } = useToast()

    const handleEdit = (event: MaintenanceEvent) => {
        setSelectedEvent(event)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este registro?")) return

        const result = await deleteMaintenanceEvent(id)
        if (result.error) {
            toast({ variant: "destructive", title: "Erro", description: result.error })
        } else {
            toast({ title: "Sucesso", description: "Manutenção excluída." })
        }
    }

    const handleClose = () => {
        setSelectedEvent(undefined)
        setIsModalOpen(false)
    }

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0 pb-6 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-2xl font-black text-slate-800">Histórico de Manutenção</CardTitle>
                    <CardDescription className="text-lg">Intervenções, revisões e corretivas.</CardDescription>
                </div>
                <Button
                    onClick={() => { setSelectedEvent(undefined); setIsModalOpen(true) }}
                    className="bg-white border-2 border-primary text-primary hover:bg-slate-50 font-bold rounded-xl h-12 px-6 shadow-sm"
                >
                    <Plus className="mr-2 h-5 w-5" /> Registrar Manutenção
                </Button>
            </CardHeader>
            <CardContent className="px-0">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-bold text-slate-500 uppercase text-xs h-14 pl-6">Data</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-xs h-14">Tipo</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-xs h-14">Status</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-xs h-14">Horímetro</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-xs h-14">Custo</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-xs h-14 text-right pr-6">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-slate-400 font-medium">
                                        Nenhuma manutenção registrada.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                events.map((evt) => {
                                    const status = statusConfig[evt.status] || statusConfig["SCHEDULED"]
                                    const type = typeConfig[evt.type] || typeConfig["PREVENTIVE"]

                                    return (
                                        <TableRow key={evt.id} className="hover:bg-slate-50 transition-colors">
                                            <TableCell className="pl-6 font-bold text-slate-700">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-slate-400" />
                                                    {format(new Date(evt.date), "dd/MM/yy")}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={`${type.class} border-0 font-bold px-3`}>
                                                    {type.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`${status.class} border font-bold uppercase text-[10px] tracking-wide`}>
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 font-mono text-slate-600 font-bold">
                                                    <Clock className="h-3 w-3 text-slate-400" />
                                                    {evt.hour_meter} h
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-slate-700 font-bold">
                                                    <DollarSign className="h-3 w-3 text-slate-400" />
                                                    {Number(evt.cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600" onClick={() => handleEdit(evt)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600" onClick={() => handleDelete(evt.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            <MaintenanceModal
                open={isModalOpen}
                onOpenChange={handleClose}
                equipmentId={equipmentId}
                eventToEdit={selectedEvent}
            />
        </Card>
    )
}
