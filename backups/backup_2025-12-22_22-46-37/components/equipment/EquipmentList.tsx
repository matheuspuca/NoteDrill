"use client"

import { useState } from "react"
import { Edit, Trash2, Plus, Grip, Truck, Zap, Activity, Wrench, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Equipment } from "@/lib/schemas-equipment"
import { deleteEquipment } from "@/app/dashboard/equipments/actions"

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
import { useToast } from "@/components/ui/use-toast"

interface EquipmentListProps {
    equipments: Equipment[]
}

export function EquipmentList({ equipments }: EquipmentListProps) {
    const { toast } = useToast()
    const router = useRouter()

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este equipamento?")) return

        const result = await deleteEquipment(id)
        if (result.error) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: result.error,
            })
        } else {
            toast({
                title: "Sucesso",
                description: "Equipamento excluído com sucesso",
            })
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case "Hidráulica": return <Zap className="h-6 w-6 text-blue-600" />
            case "Pneumática": return <Grip className="h-6 w-6 text-purple-600" />
            case "Compressor": return <Activity className="h-6 w-6 text-orange-600" />
            case "Veículo": return <Truck className="h-6 w-6 text-green-600" />
            default: return <Grip className="h-6 w-6 text-slate-500" />
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Operacional":
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 text-sm px-3 py-1">Operacional</Badge>
            case "Manutenção":
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 text-sm px-3 py-1"><Wrench className="w-3 h-3 mr-1" /> Manutenção</Badge>
            default:
                return <Badge variant="outline" className="border-slate-300 text-slate-500 text-sm px-3 py-1">Indisponível</Badge>
        }
    }

    return (
        <>
            <div className="flex justify-end mb-8">
                <Link href="/dashboard/equipments/new">
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 rounded-2xl h-14 px-8 font-black text-lg transition-all hover:scale-105"
                    >
                        <Plus className="mr-2 h-6 w-6" /> Novo Equipamento
                    </Button>
                </Link>
            </div>

            <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
                <CardHeader className="border-b border-slate-100 bg-white p-6 md:p-8">
                    <CardTitle className="text-3xl font-black text-slate-800">Frota de Equipamentos</CardTitle>
                    <CardDescription className="text-lg">Gerencie suas perfuratrizes, compressores e veículos.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="pl-8 font-bold text-base uppercase text-slate-500 py-4">Equipamento</TableHead>
                                <TableHead className="font-bold text-base uppercase text-slate-500">Tipo/Modelo</TableHead>
                                <TableHead className="font-bold text-base uppercase text-slate-500">Status</TableHead>
                                <TableHead className="font-bold text-base uppercase text-slate-500">Manutenção</TableHead>
                                <TableHead className="font-bold text-base uppercase text-slate-500 text-right pr-8">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {equipments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-40 text-center text-slate-400 text-xl font-medium">
                                        Nenhum equipamento cadastrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                equipments.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-slate-50/50 cursor-pointer h-24" onClick={() => router.push(`/dashboard/equipments/${item.id}`)}>
                                        <TableCell className="pl-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="p-4 bg-slate-100 rounded-2xl">
                                                    {getIcon(item.type)}
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-800 text-2xl tracking-tight">{item.name}</div>
                                                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wide mt-1">{item.internalCode}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-bold text-slate-700 text-lg">{item.type}</div>
                                            <div className="text-base text-slate-500 font-medium">{item.model} • {item.year}</div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="origin-left inline-block scale-110">
                                                {getStatusBadge(item.status)}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Activity className="h-5 w-5 text-slate-400" />
                                                <span className="font-mono font-black text-slate-600 text-lg">{item.hourmeter}h</span>
                                            </div>
                                            <div className="text-xs font-bold text-slate-400 mt-1 uppercase">
                                                Meta: {item.maintenanceInterval}h
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex justify-end gap-3">
                                                <Link href={`/dashboard/equipments/${item.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 hover:text-blue-600 hover:bg-blue-50 rounded-xl" onClick={(e) => e.stopPropagation()}>
                                                        <Edit className="h-5 w-5" />
                                                    </Button>
                                                </Link>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 hover:text-red-600 hover:bg-red-50 rounded-xl" onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}>
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    )
}
