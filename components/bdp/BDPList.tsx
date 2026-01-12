"use client"

import { useState } from "react"
import { Edit, Trash2, Plus, FileText, MapPin, Calendar, Clock, Loader2, CheckCircle, XCircle } from "lucide-react"
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
import { deleteBDP, updateBDPStatus } from "@/app/dashboard/bdp/actions"
import { useToast } from "@/components/ui/use-toast"
import { generateBDPPDF } from "@/components/bdp/generate-pdf"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
    const [statusFilter, setStatusFilter] = useState<string>("PENDENTE")

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

    const handleStatusUpdate = async (id: string, newStatus: 'APROVADO' | 'REJEITADO', e: React.MouseEvent) => {
        e.stopPropagation()
        const result = await updateBDPStatus(id, newStatus)

        if (result.error) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: result.error,
            })
        } else {
            toast({
                title: "Sucesso",
                description: `Status atualizado para ${newStatus}`,
            })
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

    const filteredReports = reports.filter(r => {
        if (statusFilter === "TODOS") return true
        // Default to PENDENTE if status is missing (legacy)
        const status = r.status || "PENDENTE"
        return status === statusFilter
    })

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'APROVADO':
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Aprovado</Badge>
            case 'REJEITADO':
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">Rejeitado</Badge>
            case 'PENDENTE':
            default:
                return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200">Pendente</Badge>
        }
    }

    return (
        <>
            <div className="flex flex-col gap-6 mb-10">
                <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-6">
                    <div className="flex flex-col sm:flex-row items-end gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 w-full sm:w-auto">
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
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 rounded-2xl h-16 px-10 text-xl font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-3 w-full sm:w-auto justify-center"
                        >
                            <Plus className="h-7 w-7" /> Novo BDP
                        </Button>
                    </Link>
                </div>

                <Tabs defaultValue="PENDENTE" value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                    <TabsList className="bg-slate-100 p-1 rounded-xl h-12 w-full sm:w-auto flex">
                        <TabsTrigger value="PENDENTE" className="rounded-lg h-10 px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-yellow-700 text-slate-500">Pendentes</TabsTrigger>
                        <TabsTrigger value="APROVADO" className="rounded-lg h-10 px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-green-700 text-slate-500">Aprovados</TabsTrigger>
                        <TabsTrigger value="REJEITADO" className="rounded-lg h-10 px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-red-700 text-slate-500">Rejeitados</TabsTrigger>
                        <TabsTrigger value="TODOS" className="rounded-lg h-10 px-6 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 text-slate-500">Todos</TabsTrigger>
                    </TabsList>
                </Tabs>
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
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <Table className="min-w-[1000px]">
                            <TableHeader className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm">
                                <TableRow className="border-slate-100 hover:bg-transparent">
                                    <TableHead className="pl-6 h-20 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em] w-[80px]">Nº</TableHead>
                                    <TableHead className="h-20 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em]">Data/Turno</TableHead>
                                    <TableHead className="h-20 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em]">Obra</TableHead>
                                    <TableHead className="h-20 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em]">Status</TableHead>
                                    <TableHead className="h-20 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em]">Equipamento</TableHead>
                                    <TableHead className="h-20 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em]">Operador</TableHead>
                                    <TableHead className="h-20 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em]">Produção</TableHead>
                                    <TableHead className="pr-10 h-20 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em] text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredReports.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-64 text-center text-slate-400 font-medium text-xl">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="bg-slate-50 p-6 rounded-full">
                                                    <FileText className="h-12 w-12 text-slate-300" />
                                                </div>
                                                <p>Nenhum apontamento encontrado.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredReports.map((report) => (
                                        <TableRow key={report.id} className="border-slate-50 hover:bg-blue-50/40 transition-all duration-200 group cursor-pointer">
                                            <TableCell className="pl-6 py-8">
                                                <span className="font-mono font-bold text-slate-400">#{report.reportNumber}</span>
                                            </TableCell>
                                            <TableCell className="py-8">
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
                                                {getStatusBadge(report.status)}
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
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                    {(!report.status || report.status === 'PENDENTE') && (
                                                        <>
                                                            <Button variant="ghost" size="icon" className="h-12 w-12 text-green-500 hover:text-green-700 hover:bg-green-100 rounded-xl" onClick={(e) => handleStatusUpdate(report.id, 'APROVADO', e)} title="Aprovar">
                                                                <CheckCircle className="h-6 w-6" />
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-12 w-12 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-xl" onClick={(e) => handleStatusUpdate(report.id, 'REJEITADO', e)} title="Rejeitar">
                                                                <XCircle className="h-6 w-6" />
                                                            </Button>
                                                        </>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="h-12 w-12 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl" onClick={(e) => handleExport(report, e)} disabled={generatingPdfId === report.id}>
                                                        {generatingPdfId === report.id ? <Loader2 className="h-6 w-6 animate-spin text-blue-600" /> : <FileText className="h-6 w-6" />}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-12 w-12 text-red-500 hover:text-red-600 hover:bg-red-100 rounded-xl" onClick={(e) => handleDelete(report.id, e)}>
                                                        <Trash2 className="h-6 w-6" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden flex flex-col gap-4 p-4">
                        {filteredReports.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <p>Nenhum apontamento.</p>
                            </div>
                        ) : (
                            filteredReports.map(report => (
                                <div key={report.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm active:scale-[0.98] transition-all" onClick={() => { /* Navigate to details/edit if needed, currently no route */ }}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono font-bold text-slate-400 bg-slate-100 px-1.5 rounded text-xs">#{report.reportNumber}</span>
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                                <span className="font-bold text-slate-800 text-lg">{format(new Date(report.date || new Date()), "dd/MM/yy")}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="text-xs font-bold text-blue-600 uppercase bg-blue-50 px-2 py-1 rounded-md inline-block">
                                                    {report.shift} • {report.drill?.name || report.drillId || "N/D"}
                                                </div>
                                                {getStatusBadge(report.status)}
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-10 w-10 -mt-2 -mr-2 text-slate-300">
                                            <Edit className="h-5 w-5" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                                        <div>
                                            <p className="text-xs text-slate-400 font-bold uppercase mb-0.5">Obra</p>
                                            <p className="text-sm font-bold text-slate-700 truncate max-w-[150px]">{report.projects?.name || "N/D"}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400 font-bold uppercase mb-0.5">Produção</p>
                                            <p className="text-2xl font-black text-slate-900">{report.totalMeters || 0}<span className="text-sm text-slate-400 font-bold ml-0.5">m</span></p>
                                        </div>
                                    </div>

                                    {(!report.status || report.status === 'PENDENTE') && (
                                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
                                            <Button
                                                className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 border-none font-bold h-10 rounded-xl"
                                                onClick={(e) => handleStatusUpdate(report.id, 'APROVADO', e)}
                                            >
                                                <CheckCircle className="mr-2 h-4 w-4" /> Aprovar
                                            </Button>
                                            <Button
                                                className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 border-none font-bold h-10 rounded-xl"
                                                onClick={(e) => handleStatusUpdate(report.id, 'REJEITADO', e)}
                                            >
                                                <XCircle className="mr-2 h-4 w-4" /> Rejeitar
                                            </Button>
                                        </div>
                                    )}

                                    <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
                                        <Button
                                            className="flex-1 bg-slate-50 text-slate-600 hover:bg-slate-100 border-none font-bold h-12 rounded-xl"
                                            onClick={(e) => handleExport(report, e)}
                                            disabled={generatingPdfId === report.id}
                                        >
                                            {generatingPdfId === report.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                                            PDF
                                        </Button>
                                        <Button
                                            className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 border-none font-bold h-12 rounded-xl"
                                            onClick={(e) => handleDelete(report.id, e)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Excluir
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </>
    )
}
