"use client"

import { useState } from "react"
import { Edit, Trash2, Plus, HardHat, AlertTriangle, Calendar } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { EPI } from "@/lib/schemas-epi"
import { deleteEPI } from "@/app/dashboard/inventory/actions"
import { Project } from "@/lib/schemas-project"

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
import { format } from "date-fns"

interface EPIListProps {
    items: EPI[]
    projects: Project[]
}

export function EPIList({ items, projects }: EPIListProps) {
    const { toast } = useToast()
    const router = useRouter()

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este EPI?")) return
        const result = await deleteEPI(id)
        if (result.error) {
            toast({ variant: "destructive", title: "Erro", description: result.error })
        } else {
            toast({ title: "Sucesso", description: "EPI excluído." })
        }
    }

    // Sort items by project name
    const sortedItems = [...items].sort((a, b) => {
        const projA = a.projects?.name || ""
        const projB = b.projects?.name || ""
        return projA.localeCompare(projB)
    })

    return (
        <>
            <div className="flex justify-end mb-8 gap-4">
                <Link
                    href="/dashboard/inventory/new-epi"
                    className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 rounded-xl h-12 px-6 font-bold transition-all"
                >
                    <Plus className="mr-2 h-5 w-5" /> Novo EPI
                </Link>
            </div>

            <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
                <CardHeader className="border-b border-slate-100 bg-white p-6 md:p-8">
                    <CardTitle className="text-2xl font-black text-slate-800">Controle de EPIs</CardTitle>
                    <CardDescription>Gerencie equipamentos de proteção individual por Obra.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="pl-8 font-bold text-xs uppercase text-slate-500">Equipamento</TableHead>
                                <TableHead className="font-bold text-xs uppercase text-slate-500">CA / Validade</TableHead>
                                <TableHead className="font-bold text-xs uppercase text-slate-500">Obra</TableHead>
                                <TableHead className="font-bold text-xs uppercase text-slate-500">Tamanho</TableHead>
                                <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Valor Unit.</TableHead>
                                <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Total</TableHead>
                                <TableHead className="font-bold text-xs uppercase text-slate-500 text-right">Qtd.</TableHead>
                                <TableHead className="font-bold text-xs uppercase text-slate-500 text-right pr-8">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-40 text-center text-slate-400">
                                        Nenhum EPI cadastrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedItems.map((item) => (
                                    <TableRow key={item.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => router.push(`/dashboard/inventory/epi/${item.id}`)}>
                                        <TableCell className="pl-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 rounded-lg">
                                                    <HardHat className="h-5 w-5 text-slate-500" />
                                                </div>
                                                <span className="font-bold text-slate-700 text-base">{item.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <Badge variant="outline" className="w-fit border-blue-200 bg-blue-50 text-blue-700">
                                                    CA: {item.ca}
                                                </Badge>
                                                {item.expirationDate && (
                                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {format(new Date(item.expirationDate), "dd/MM/yyyy")}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-medium text-slate-600 bg-slate-50">
                                                {item.projects?.name || "Geral"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-500 text-sm">
                                            {item.size || "-"}
                                        </TableCell>
                                        <TableCell className="text-right text-sm text-slate-600">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.value) || 0)}
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-medium text-slate-900">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((Number(item.value) || 0) * (Number(item.quantity) || 0))}
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-slate-700">
                                            <div className="flex items-center justify-end gap-2">
                                                {Number(item.quantity) <= (Number(item.minStock) || 0) && (
                                                    <div className="group relative">
                                                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                        <span className="absolute bottom-full right-0 mb-2 w-max px-2 py-1 text-xs text-white bg-amber-600 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                            Estoque Baixo (Min: {item.minStock})
                                                        </span>
                                                    </div>
                                                )}
                                                {item.quantity} <span className="text-xs text-slate-400 font-normal">{item.unit}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={`/dashboard/inventory/epi/${item.id}`}
                                                    className="inline-flex items-center justify-center hover:text-blue-600 hover:bg-blue-50 h-10 w-10 rounded-xl transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                                <Button variant="ghost" size="icon" className="hover:text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}>
                                                    <Trash2 className="h-4 w-4" />
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
