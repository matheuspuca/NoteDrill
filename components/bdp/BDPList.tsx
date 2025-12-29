"use client"

import { useState } from "react"
import { Edit, Trash2, Plus, FileText, MapPin, Calendar, Clock, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"

import { BDP } from "@/lib/schemas-bdp"
import { CompanySettingsSchema } from "@/lib/schemas-settings"
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
import { deleteBDP } from "@/app/dashboard/bdp/actions"
import { useToast } from "@/components/ui/use-toast"
import { generateBDPPDF } from "@/components/bdp/generate-pdf"
import { useRouter, useSearchParams } from "next/navigation"

interface BDPListProps {
    reports: BDP[]
    companySettings?: CompanySettingsSchema & { logo_url?: string | null } | null
}

export function BDPList({ reports, companySettings }: BDPListProps) {
    const { toast } = useToast()
    const router = useRouter()
    const searchParams = useSearchParams()

    const [startDate, setStartDate] = useState(searchParams.get("startDate") || "")
    const [endDate, setEndDate] = useState(searchParams.get("endDate") || "")
    const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null)

    const handleFilter = () => {
        const params = new URLSearchParams()
        if (startDate) params.set("startDate", startDate)
        if (endDate) params.set("endDate", endDate)
        router.push(`/dashboard/bdp?${params.toString()}`)
    }

    const clearFilter = () => {
        setStartDate("")
        setEndDate("")
        router.push("/dashboard/bdp")
    }

    const handleExport = async (report: BDP, e: React.MouseEvent) => {
        e.stopPropagation()
        setGeneratingPdfId(report.id)
        try {
            await generateBDPPDF(report, companySettings)
            toast({
                title: "PDF Gerado",
                description: "O download do BDP foi iniciado.",
            })
        } catch (error) {
            console.error(error)
            toast({
                variant: "destructive",
                title: "Erro ao gerar PDF",
                description: "Não foi possível gerar o arquivo.",
            })
        } finally {
            setGeneratingPdfId(null)
        }
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (!confirm("Tem certeza que deseja excluir este apontamento?")) return

        const result = await deleteBDP(id)
        if (result.error) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: result.error,
            })
        } else {
            toast({
                title: "Sucesso",
                description: "Apontamento excluído com sucesso",
            })
        }
    }

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-10 gap-6">
                <div className="flex flex-col sm:flex-row items-end gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-1">Data Inicial</label>
                        <input
                            type="date"
                            className="h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 block mb-1">Data Final</label>
                        <input
                            type="date"
                            className="h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleFilter} variant="default" className="bg-slate-800 hover:bg-slate-900 text-white h-10 px-6 rounded-lg">
                            Filtrar
                        </Button>
                        {(startDate || endDate) && (
                            <Button onClick={clearFilter} variant="ghost" className="text-slate-500 hover:text-red-500 h-10 px-3 rounded-lg">
                                Limpar
                            </Button>
                        )}
                    </div>
                </div>

                <Link href="/dashboard/bdp/new">
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 rounded-2xl h-16 px-10 text-xl font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                    >
                        <Plus className="h-7 w-7" /> Novo BDP
                    </Button>
                </Link>
            </div>

            <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-white ring-1 ring-slate-100">
                <CardHeader className="border-b border-slate-100 bg-white p-10">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-blue-50 rounded-2xl ring-1 ring-blue-100">
                            <FileText className="h-10 w-10 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-black text-slate-800 tracking-tight">Boletim Diário de Perfuração (BDP)</CardTitle>
                            <CardDescription className="text-slate-500 font-medium mt-2 text-lg">
                                Controle operacional de perfuração diária.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm">
                            <TableRow className="border-slate-100 hover:bg-transparent">
                                <TableHead className="pl-10 h-20 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em]">Data/Turno</TableHead>
                                <TableHead className="h-20 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em]">Obra</TableHead>
                                <TableHead className="h-20 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em]">Equipamento</TableHead>
                                <TableHead className="h-20 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em]">Operador</TableHead>
                                <TableHead className="h-20 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em]">Produção</TableHead>
                                <TableHead className="pr-10 h-20 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em] text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center text-slate-400 font-medium text-xl">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="bg-slate-50 p-6 rounded-full">
                                                <FileText className="h-12 w-12 text-slate-300" />
                                            </div>
                                            <p>Nenhum apontamento encontrado.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reports.map((report) => (
                                    <TableRow key={report.id} className="border-slate-50 hover:bg-blue-50/40 transition-all duration-200 group cursor-pointer">
                                        <TableCell className="pl-10 py-8">
                                            <div className="flex bg-slate-100 w-fit px-3 py-1 rounded-lg border border-slate-200 items-center gap-2 mb-1">
                                                <Calendar className="h-4 w-4 text-slate-500" />
                                                <span className="font-bold text-slate-700">{format(new Date(report.date || new Date()), "dd/MM/yy")}</span>
                                            </div>
                                            <div className="text-sm font-bold text-blue-600 mt-1 uppercase tracking-wide flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {report.shift}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-8">
                                            <div className="font-black text-slate-800 text-lg">{report.projects?.name || "Obra N/D"}</div>
                                        </TableCell>
                                        <TableCell className="py-8">
                                            <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-200 font-bold text-sm px-3 py-1">
                                                {report.drill?.name || report.drillId || "N/D"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-8">
                                            <div className="font-bold text-slate-700 text-lg">{report.operator?.name || "Operador N/D"}</div>
                                        </TableCell>
                                        <TableCell className="py-8">
                                            <div className="flex flex-col">
                                                <span className="text-2xl font-black text-slate-900">{report.totalMeters || 0}m</span>
                                                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Perfurados</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="pr-10 py-8 text-right">
                                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-12 w-12 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all hover:scale-110"
                                                    onClick={(e) => handleExport(report, e)}
                                                    title="Exportar PDF"
                                                    disabled={generatingPdfId === report.id}
                                                >
                                                    {generatingPdfId === report.id ? (
                                                        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                                    ) : (
                                                        <FileText className="h-6 w-6" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-12 w-12 text-red-500 hover:text-red-600 hover:bg-red-100 rounded-xl transition-all hover:scale-110"
                                                    onClick={(e) => handleDelete(report.id, e)}
                                                >
                                                    <Trash2 className="h-6 w-6" />
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
