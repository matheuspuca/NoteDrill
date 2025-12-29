"use client"

import { useState } from "react"
import { Edit, Trash2, Plus, Package, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { InventoryItem } from "@/lib/schemas-inventory"
import { deleteInventoryItem } from "@/app/dashboard/inventory/actions"
import { Project } from "@/lib/schemas-project"
import { StockTransferDialog } from "@/components/inventory/StockTransferDialog"

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

interface InventoryListProps {
    items: InventoryItem[]
    projects: Project[]
}

export function InventoryList({ items, projects }: InventoryListProps) {
    const { toast } = useToast()
    const router = useRouter()

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este item?")) return
        const result = await deleteInventoryItem(id)
        if (result.error) {
            toast({ variant: "destructive", title: "Erro", description: result.error })
        } else {
            toast({ title: "Sucesso", description: "Item excluído." })
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
                <StockTransferDialog items={items} projects={projects} />
                <Link href="/dashboard/inventory/new">
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 rounded-2xl h-14 px-8 font-black text-lg transition-all hover:scale-105"
                    >
                        <Plus className="mr-2 h-6 w-6" /> Novo Item
                    </Button>
                </Link>
            </div>

            <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
                <CardHeader className="border-b border-slate-100 bg-white p-6 md:p-8">
                    <CardTitle className="text-3xl font-black text-slate-800">Estoque por Obra</CardTitle>
                    <CardDescription className="text-lg">Gerencie materiais, ferramentas e insumos em cada projeto.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="pl-8 font-bold text-base uppercase text-slate-500 py-4">Item</TableHead>
                                <TableHead className="font-bold text-base uppercase text-slate-500">Obra</TableHead>
                                <TableHead className="font-bold text-base uppercase text-slate-500">Marca/Detalhes</TableHead>
                                <TableHead className="font-bold text-base uppercase text-slate-500 text-right">Qtd.</TableHead>
                                <TableHead className="font-bold text-base uppercase text-slate-500 text-right">Valor Unit.</TableHead>
                                <TableHead className="font-bold text-base uppercase text-slate-500 text-right pr-8">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-40 text-center text-slate-400 text-xl font-medium">
                                        Estoque vazio.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sortedItems.map((item) => {
                                    const isLowStock = (item.quantity || 0) <= (item.minStock || 0)
                                    return (
                                        <TableRow key={item.id} className="hover:bg-slate-50/50 cursor-pointer h-24" onClick={() => router.push(`/dashboard/inventory/${item.id}`)}>
                                            <TableCell className="pl-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-4 bg-slate-100 rounded-2xl">
                                                        <Package className="h-6 w-6 text-slate-500" />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-800 text-xl tracking-tight">{item.name}</div>
                                                        {isLowStock && (
                                                            <Badge variant="outline" className="mt-2 border-red-200 bg-red-50 text-red-600 text-xs font-bold gap-1 px-2 py-1">
                                                                <AlertTriangle className="w-3 h-3" /> Estoque Baixo
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-bold text-slate-600 bg-slate-50 text-base px-3 py-1">
                                                    {item.projects?.name || "Geral"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-lg font-medium">
                                                {item.brand || "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-mono font-black text-slate-700 text-xl">
                                                {item.quantity} <span className="text-sm text-slate-400 font-bold">{item.unit}</span>
                                            </TableCell>
                                            <TableCell className="text-right text-slate-600 text-lg font-medium">
                                                R$ {Number(item.value).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <div className="flex justify-end gap-3">
                                                    <Link href={`/dashboard/inventory/${item.id}`}>
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
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    )
}
