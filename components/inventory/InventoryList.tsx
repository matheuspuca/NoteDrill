"use client"

import { useState } from "react"
import { Edit, Trash2, Plus, Package, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { InventoryItem } from "@/lib/schemas-inventory"
import { deleteInventoryItem } from "@/app/dashboard/inventory/actions"
import { Project } from "@/lib/schemas-project"
import { StockTransferDialog } from "@/components/inventory/StockTransferDialog"
import { InventoryReportButton } from "@/components/inventory/InventoryReportButton"
import { InventoryAnalytics } from "@/components/inventory/InventoryAnalytics"

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

import { Project } from "@/lib/schemas-project"
import { CompanySettingsSchema } from "@/lib/schemas-settings"

interface InventoryListProps {
    items: InventoryItem[]
    projects: Project[]
    companySettings?: CompanySettingsSchema & { logo_url?: string | null } | null
}

export function InventoryList({ items, projects, companySettings }: InventoryListProps) {
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

    // Group items by project
    const groupedItems = items.reduce((acc, item) => {
        const projectName = item.projects?.name || "Geral / Sem Obra"
        if (!acc[projectName]) {
            acc[projectName] = []
        }
        acc[projectName].push(item)
        return acc
    }, {} as Record<string, InventoryItem[]>)

    // Sort projects alphabetically
    const sortedProjects = Object.keys(groupedItems).sort()

    return (
        <>
            <InventoryAnalytics items={items} />

            <div className="flex justify-end mb-8 gap-4">
                <StockTransferDialog items={items} projects={projects} />
                <InventoryReportButton items={items} label="Inventário" companySettings={companySettings} />
                <Link
                    href="/dashboard/inventory/new"
                    className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 rounded-2xl h-14 px-8 font-black text-lg transition-all hover:scale-105"
                >
                    <Plus className="mr-2 h-6 w-6" /> Novo Item
                </Link>
            </div>

            <div className="space-y-10">
                {sortedProjects.length === 0 ? (
                    <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
                        <CardContent className="p-10 text-center">
                            <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-600">Nenhum item em estoque.</h3>
                            <p className="text-slate-400">Clique em "Novo Item" para começar.</p>
                        </CardContent>
                    </Card>
                ) : (
                    sortedProjects.map((projectName) => {
                        const projectItems = groupedItems[projectName]
                        const totalValue = projectItems.reduce((acc, item) => acc + (Number(item.value || 0) * Number(item.quantity || 0)), 0)

                        return (
                            <Card key={projectName} className="border-none shadow-xl rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
                                <CardHeader className="border-b border-slate-100 bg-white p-6 md:p-8 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                            {projectName}
                                            <Badge variant="secondary" className="text-sm font-bold bg-slate-100 text-slate-600">
                                                {projectItems.length} itens
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription className="text-base mt-1">Estoque alocado nesta obra.</CardDescription>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <InventoryReportButton
                                            items={projectItems}
                                            label="Relatório PDF"
                                            reportTitle={`Inventário: ${projectName}`}
                                            className="h-10 px-4 text-sm bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 font-bold rounded-xl"
                                            companySettings={companySettings}
                                        />
                                        <div className="text-right border-l pl-6 border-slate-100">
                                            <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Valor Total</div>
                                            <div className="text-2xl font-black text-emerald-600">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead className="pl-8 font-bold text-base uppercase text-slate-500 py-4">Item</TableHead>
                                                {/* Removed Obra Column as it is redundant now */}
                                                <TableHead className="font-bold text-base uppercase text-slate-500">Marca/Detalhes</TableHead>
                                                <TableHead className="font-bold text-base uppercase text-slate-500 text-right">Qtd.</TableHead>
                                                <TableHead className="font-bold text-base uppercase text-slate-500 text-right">Valor Unit.</TableHead>
                                                <TableHead className="font-bold text-base uppercase text-slate-500 text-right pr-8">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {projectItems.map((item) => {
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
                                                        {/* Removed Obra Cell */}
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
                                                                <Link
                                                                    href={`/dashboard/inventory/${item.id}`}
                                                                    className="inline-flex items-center justify-center h-10 w-10 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <Edit className="h-5 w-5" />
                                                                </Link>
                                                                <Button variant="ghost" size="icon" className="h-10 w-10 hover:text-red-600 hover:bg-red-50 rounded-xl" onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}>
                                                                    <Trash2 className="h-5 w-5" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </div>
        </>
    )
}
