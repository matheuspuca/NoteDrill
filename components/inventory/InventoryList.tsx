"use client"

import { useState } from "react"
import { Edit, Trash2, Plus, Package, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { InventoryItem, ProjectAsset } from "@/lib/schemas-inventory"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AssetList } from "./AssetList"

import { CompanySettingsSchema } from "@/lib/schemas-settings"

interface InventoryListProps {
    items: InventoryItem[]
    projects: Project[]
    companySettings?: CompanySettingsSchema & { logo_url?: string | null } | null
    assets?: ProjectAsset[]
}

export function InventoryList({ items, projects, companySettings, assets = [] }: InventoryListProps) {
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
        <Tabs defaultValue="stock" className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <TabsList className="bg-white p-1 rounded-xl h-14 border border-slate-100 shadow-sm w-full md:w-auto grid grid-cols-2 md:inline-flex">
                    <TabsTrigger value="stock" className="h-12 rounded-lg text-base font-bold data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                        📦 Estoque & Insumos
                    </TabsTrigger>
                    <TabsTrigger value="assets" className="h-12 rounded-lg text-base font-bold data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                        🏢 Patrimônio
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="stock" className="space-y-8 outline-none animate-in fade-in slide-in-from-left-4 duration-500">
                <InventoryAnalytics items={items} />

                <div className="flex flex-col md:flex-row justify-end mb-8 gap-4">
                    <StockTransferDialog items={items} projects={projects} />
                    <InventoryReportButton items={items} label="Inventário" companySettings={companySettings} />
                    <Link
                        href="/dashboard/inventory/new"
                        className="w-full md:w-auto flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 rounded-2xl h-14 px-8 font-black text-lg transition-all hover:scale-105"
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
                            const projectTotalValue = projectItems.reduce((acc, item) => acc + (Number(item.value || 0) * Number(item.quantity || 0)), 0)

                            // Group by Type within Project
                            const itemsByType = projectItems.reduce((acc, item) => {
                                const type = item.type || "Material"
                                if (!acc[type]) acc[type] = []
                                acc[type].push(item)
                                return acc
                            }, {} as Record<string, InventoryItem[]>)

                            const sortedTypes = Object.keys(itemsByType).sort()

                            return (
                                <Card key={projectName} className="border-none shadow-xl rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
                                    <CardHeader className="border-b border-slate-100 bg-white p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div>
                                            <CardTitle className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                                {projectName}
                                                <Badge variant="secondary" className="text-sm font-bold bg-slate-100 text-slate-600">
                                                    {projectItems.length} itens
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription className="text-base mt-1">Estoque alocado nesta obra.</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                                            <InventoryReportButton
                                                items={projectItems}
                                                label="Relatório PDF"
                                                reportTitle={`Inventário: ${projectName}`}
                                                className="h-10 px-4 text-sm bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 font-bold rounded-xl"
                                                companySettings={companySettings}
                                            />
                                            <div className="text-right border-l pl-6 border-slate-100">
                                                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Valor Total</div>
                                                <div className="text-2xl font-black text-emerald-600">
                                                    {projectTotalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {sortedTypes.map((type) => (
                                            <div key={type} className="border-b border-slate-100 last:border-none">
                                                <div className="bg-slate-50/50 px-6 py-3 border-y border-slate-100/50">
                                                    <h4 className="font-bold text-slate-500 uppercase tracking-wider text-sm flex items-center gap-2">
                                                        {type === "EPI" && <span className="w-2 h-2 rounded-full bg-orange-400"></span>}
                                                        {type === "Material" && <span className="w-2 h-2 rounded-full bg-blue-400"></span>}
                                                        {type === "Ferramenta" && <span className="w-2 h-2 rounded-full bg-purple-400"></span>}
                                                        {type === "Combustível" && <span className="w-2 h-2 rounded-full bg-yellow-400"></span>}
                                                        {type}
                                                    </h4>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <Table className="min-w-[800px]">
                                                        <TableHeader>
                                                            <TableRow className="hover:bg-transparent border-none">
                                                                <TableHead className="pl-8 font-bold text-xs uppercase text-slate-400 w-[40%]">Item</TableHead>
                                                                <TableHead className="font-bold text-xs uppercase text-slate-400">Marca/Detalhes</TableHead>
                                                                <TableHead className="font-bold text-xs uppercase text-slate-400 text-right">Qtd.</TableHead>
                                                                <TableHead className="font-bold text-xs uppercase text-slate-400 text-right">Valor Unit.</TableHead>
                                                                <TableHead className="font-bold text-xs uppercase text-slate-400 text-right">Total</TableHead>
                                                                <TableHead className="font-bold text-xs uppercase text-slate-400 text-right pr-8">Ações</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {itemsByType[type].map((item) => {
                                                                const isLowStock = (item.quantity || 0) <= (item.minStock || 0)
                                                                return (
                                                                    <TableRow key={item.id} className="hover:bg-slate-50/80 cursor-pointer h-20 border-slate-100" onClick={() => router.push(`/dashboard/inventory/${item.id}`)}>
                                                                        <TableCell className="pl-8 py-4">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                                                                    <Package className="h-5 w-5 text-slate-400" />
                                                                                </div>
                                                                                <div>
                                                                                    <div className="font-bold text-slate-700 text-base">{item.name}</div>
                                                                                    {isLowStock && (
                                                                                        <Badge variant="outline" className="mt-1 border-red-200 bg-red-50 text-red-600 text-[10px] font-bold px-1.5 py-0.5 h-auto">
                                                                                            Estoque Baixo
                                                                                        </Badge>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="text-slate-500 font-medium text-sm">
                                                                            {item.brand || <span className="text-slate-300">-</span>}
                                                                            {item.model && <span className="text-slate-400 ml-1">({item.model})</span>}
                                                                        </TableCell>
                                                                        <TableCell className="text-right text-base font-bold text-slate-600">
                                                                            {item.quantity} <span className="text-xs text-slate-400 font-medium ml-0.5">{item.unit}</span>
                                                                        </TableCell>
                                                                        <TableCell className="text-right text-slate-500 font-medium">
                                                                            R$ {Number(item.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                        </TableCell>
                                                                        <TableCell className="text-right text-emerald-600 font-bold">
                                                                            R$ {(Number(item.quantity || 0) * Number(item.value || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                        </TableCell>
                                                                        <TableCell className="text-right pr-8">
                                                                            <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                                                                                    onClick={() => router.push(`/dashboard/inventory/${item.id}`)}
                                                                                >
                                                                                    <Edit className="h-4 w-4" />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-8 w-8 hover:bg-red-50 hover:text-red-600 rounded-lg"
                                                                                    onClick={() => handleDelete(item.id)}
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </div>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )
                                                            })}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )
                        })
                    )}
                </div>
            </TabsContent>

            <TabsContent value="assets" className="outline-none">
                <AssetList assets={assets} projects={projects} />
            </TabsContent>
        </Tabs>
    )
}
