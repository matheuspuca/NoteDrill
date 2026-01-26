"use client"

import { useState } from "react"
import { Edit, Trash2, Plus, Monitor, Search, DollarSign, Calendar, Tag, FileText } from "lucide-react"
import { format } from "date-fns"

import { ProjectAsset } from "@/lib/schemas-inventory"
import { deleteAsset } from "@/app/dashboard/inventory/assets/actions"
import { AssetModal } from "./AssetModal"

import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface AssetListProps {
    assets: ProjectAsset[]
    projects: { id: string, name: string }[]
}

export function AssetList({ assets, projects }: AssetListProps) {
    const { toast } = useToast()
    const [searchTerm, setSearchTerm] = useState("")
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedAsset, setSelectedAsset] = useState<ProjectAsset | undefined>(undefined)

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este patrimônio?")) return
        const result = await deleteAsset(id)
        if (result.error) {
            toast({ variant: "destructive", title: "Erro", description: result.error })
        } else {
            toast({ title: "Sucesso", description: "Patrimônio excluído." })
        }
    }

    const handleEdit = (asset: ProjectAsset) => {
        setSelectedAsset(asset)
        setIsModalOpen(true)
    }

    const handleNew = () => {
        setSelectedAsset(undefined)
        setIsModalOpen(true)
    }

    const filteredAssets = assets.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.tag_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalValue = filteredAssets.reduce((acc, curr) => acc + (Number(curr.value) * Number(curr.quantity)), 0)

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header / Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-indigo-500 to-blue-600 border-none shadow-lg text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-3 rounded-xl"><Monitor className="w-8 h-8 text-white" /></div>
                            <div>
                                <p className="text-white/80 font-medium">Total de Itens</p>
                                <h3 className="text-3xl font-black">{filteredAssets.length}</h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white border-none shadow-lg text-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-green-100 p-3 rounded-xl"><DollarSign className="w-8 h-8 text-green-600" /></div>
                            <div>
                                <p className="text-slate-500 font-medium">Valor Total (Estimado)</p>
                                <h3 className="text-3xl font-black text-slate-800">
                                    {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <Input
                        placeholder="Buscar por nome, tag ou NF..."
                        className="pl-10 h-12 bg-slate-50 border-slate-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button
                    onClick={handleNew}
                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-indigo-200"
                >
                    <Plus className="mr-2 h-5 w-5" /> Novo Patrimônio
                </Button>
            </div>

            {/* Table */}
            <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white">
                <Table>
                    <TableHeader className="bg-slate-50">
                        <TableRow>
                            <TableHead className="font-bold text-slate-600 pl-6 h-14">Item / Descrição</TableHead>
                            <TableHead className="font-bold text-slate-600 h-14">Identificação</TableHead>
                            <TableHead className="font-bold text-slate-600 h-14">Localização</TableHead>
                            <TableHead className="font-bold text-slate-600 h-14">Compra / NF</TableHead>
                            <TableHead className="font-bold text-slate-600 h-14 text-right pr-6">Valor</TableHead>
                            <TableHead className="font-bold text-slate-600 h-14 text-right pr-6">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAssets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                                    Nenhum patrimônio encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredAssets.map(asset => (
                                <TableRow key={asset.id} className="hover:bg-slate-50/50">
                                    <TableCell className="pl-6 py-4">
                                        <div>
                                            <p className="font-bold text-slate-800 text-base">{asset.name}</p>
                                            {asset.description && <p className="text-sm text-slate-500 line-clamp-1">{asset.description}</p>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            {asset.tag_number && (
                                                <Badge variant="outline" className="w-fit bg-indigo-50 text-indigo-700 border-indigo-200 font-mono">
                                                    <Tag className="w-3 h-3 mr-1" /> {asset.tag_number}
                                                </Badge>
                                            )}
                                            <span className="text-xs font-bold text-slate-500">Qtd: {asset.quantity}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-bold text-slate-600 bg-slate-100">
                                            {asset.projects?.name || "Estoque Geral"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-slate-600">
                                            {asset.purchase_date && (
                                                <div className="flex items-center gap-1 mb-1">
                                                    <Calendar className="w-3 h-3 text-slate-400" />
                                                    {format(new Date(asset.purchase_date), "dd/MM/yyyy")}
                                                </div>
                                            )}
                                            {asset.invoice_number && (
                                                <div className="flex items-center gap-1">
                                                    <FileText className="w-3 h-3 text-slate-400" />
                                                    NF: {asset.invoice_number}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <span className="font-bold text-slate-700">
                                            {Number(asset.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600" onClick={() => handleEdit(asset)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600" onClick={() => handleDelete(asset.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            <AssetModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                assetToEdit={selectedAsset}
                projects={projects}
            />
        </div>
    )
}
