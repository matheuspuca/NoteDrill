"use client"

import { useState } from "react"
import { Edit, Trash2, Plus, FileText, MapPin, Calendar, Clock, Loader2, CheckCircle, XCircle } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"

import { BDP } from "@/lib/schemas-bdp"
import { CompanySettingsSchema } from "@/lib/schemas-settings"
import { UnifiedActionButtons } from "@/components/ui/unified-actions"
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
import { BDPKPIs } from "@/components/bdp/BDPKPIs"

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
    const [statusFilter, setStatusFilter] = useState<string>("TODOS")

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

    const projectFilter = searchParams.get("project")

    const filteredReports = reports.filter(item => {
        if (startDate && item.date && new Date(item.date) < new Date(startDate)) return false
        if (endDate && item.date && new Date(item.date) > new Date(endDate)) return false

        if (projectFilter && item.projects?.name !== projectFilter) return false

        if (statusFilter === 'TODOS') return true
        if (statusFilter === 'APROVADO') return item.status === 'APROVADO'
        if (statusFilter === 'REJEITADO') return item.status === 'REJEITADO'
        return (!item.status || item.status === 'PENDENTE')
    })

    // Group items by project
    const groupedReports = filteredReports.reduce((acc, report) => {
        const projectName = report.projects?.name || "Sem Obra / Geral"
        if (!acc[projectName]) {
            acc[projectName] = []
        }
        acc[projectName].push(report)
        return acc
    }, {} as Record<string, BDP[]>)

    const sortedProjects = Object.keys(groupedReports).sort()

    const getStatusBadge = (status?: string) => {
        switch (status) {
            case 'APROVADO': return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Aprovado</Badge>
            case 'REJEITADO': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200">Rejeitado</Badge>
            default: return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200">Pendente</Badge>
        }
    }

    return (
        <div className="space-y-8">
            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex gap-4 items-center w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                        <TabsList className="bg-slate-100 p-1 rounded-xl h-11">
                            <TabsTrigger value="TODOS" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-800 data-[state=active]:shadow-sm font-bold">Todos</TabsTrigger>
                            <TabsTrigger value="PENDENTE" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-bold">Pendentes</TabsTrigger>
                            <TabsTrigger value="APROVADO" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm font-bold">Aprovados</TabsTrigger>
                            <TabsTrigger value="REJEITADO" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm font-bold">Rejeitados</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="h-8 w-px bg-slate-200 hidden md:block" />

                    <div className="flex gap-2 items-center">
                        <input
                            type="date"
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <span className="text-slate-400 font-bold">-</span>
                        <input
                            type="date"
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                        <Button variant="ghost" size="icon" onClick={handleFilter} className="text-blue-600 hover:bg-blue-50 rounded-lg">
                            <Clock className="w-4 h-4" />
                        </Button>
                        {(startDate || endDate) && (
                            <Button variant="ghost" size="sm" onClick={clearFilter} className="text-red-400 hover:text-red-600 text-xs">
                                Limpar
                            </Button>
                        )}
                    </div>
                </div>

                <Link href="/dashboard/bdp/new">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 rounded-xl font-bold h-11 px-6">
                        <Plus className="mr-2 h-4 w-4" /> Novo BDP
                    </Button>
                </Link>
            </div>

            {/* Project Filter Logic */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Filtrar por Obra:</span>
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={statusFilter === 'TODOS' && !searchParams.get("project") ? "default" : "outline"}
                        className={statusFilter === 'TODOS' && !searchParams.get("project") ? "bg-slate-800 text-white" : "bg-white text-slate-600 border-slate-200"}
                        onClick={() => {
                            const params = new URLSearchParams(searchParams.toString())
                            params.delete("project")
                            router.push(`/dashboard/bdp?${params.toString()}`)
                        }}
                    >
                        Todas
                    </Button>
                    {Array.from(new Set(reports.map(r => r.projects?.name).filter(Boolean))).sort().map(projectName => {
                        const isSelected = searchParams.get("project") === projectName
                        return (
                            <Button
                                key={projectName}
                                variant={isSelected ? "default" : "outline"}
                                className={isSelected ? "bg-blue-600 text-white" : "bg-white text-slate-600 border-slate-200"}
                                onClick={() => {
                                    const params = new URLSearchParams(searchParams.toString())
                                    if (projectName) params.set("project", projectName)
                                    router.push(`/dashboard/bdp?${params.toString()}`)
                                }}
                            >
                                {projectName}
                            </Button>
                        )
                    })}
                </div>
            </div>

            {/* KPIs Section - Moved here to be below filters */}
            <BDPKPIs reports={filteredReports} />

            {/* Content: Grouped by Project */}
            <div className="space-y-10">
                {sortedProjects.length === 0 ? (
                    <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
                        <CardContent className="p-10 text-center">
                            <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-slate-600">Nenhum apontamento encontrado.</h3>
                            <p className="text-slate-400">Tente ajustar os filtros ou clique em "Novo BDP".</p>
                        </CardContent>
                    </Card>
                ) : (
                    sortedProjects.map((projectName) => {
                        const projectReports = groupedReports[projectName]
                        const totalProjectMeters = projectReports.reduce((acc, r) => acc + (Number(r.totalMeters) || 0), 0)

                        return (
                            <Card key={projectName} className="border-none shadow-xl rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
                                <CardHeader className="border-b border-slate-100 bg-white p-6 md:p-8 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-2xl font-black text-slate-800 flex items-center gap-3">
                                            <MapPin className="h-6 w-6 text-blue-500" />
                                            {projectName}
                                            <Badge variant="secondary" className="text-sm font-bold bg-slate-100 text-slate-600">
                                                {projectReports.length} relatórios
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription className="text-base mt-1 text-slate-400 font-medium">
                                            Apontamentos desta obra
                                        </CardDescription>
                                    </div>
                                    <div className="text-right border-l pl-6 border-slate-100 hidden md:block">
                                        <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Metros Perfurados</div>
                                        <div className="text-2xl font-black text-blue-600">{totalProjectMeters.toFixed(1)}m</div>
                                    </div>
                                </CardHeader>

                                <div className="overflow-x-auto">
                                    <Table className="min-w-[1000px]">
                                        <TableHeader className="bg-slate-50/80">
                                            <TableRow className="border-slate-100 hover:bg-transparent">
                                                <TableHead className="pl-6 h-14 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em] w-[80px]">Nº</TableHead>
                                                <TableHead className="h-14 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em]">Data</TableHead>
                                                <TableHead className="h-14 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em]">Turno</TableHead>
                                                <TableHead className="h-14 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em]">Status</TableHead>
                                                <TableHead className="h-14 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em]">Equipamento</TableHead>
                                                <TableHead className="h-14 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em]">Operador</TableHead>
                                                <TableHead className="h-14 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em] text-right">Produção</TableHead>
                                                <TableHead className="pr-8 h-14 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em] text-right w-[180px]">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {projectReports.map((report) => (
                                                <TableRow key={report.id} className="border-slate-50 hover:bg-slate-50/50 transition-all duration-200 group cursor-pointer" onClick={() => router.push(`/dashboard/bdp/${report.id}`)}>
                                                    <TableCell className="pl-6 py-4">
                                                        <span className="font-mono font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded text-xs">#{report.reportNumber}</span>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-2 font-bold text-slate-700">
                                                            <Calendar className="h-4 w-4 text-slate-400" />
                                                            {report.date ? format(new Date(report.date + 'T12:00:00'), "dd/MMM", { locale: ptBR }).toUpperCase() : format(new Date(), "dd/MMM", { locale: ptBR }).toUpperCase()}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex items-center gap-1 text-sm font-semibold text-slate-600">
                                                            <Clock className="h-3 w-3 text-slate-400" />
                                                            {report.shift}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        {getStatusBadge(report.status)}
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <span className="font-bold text-slate-700 text-sm">{report.drill?.name || report.drillId || "N/D"}</span>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="text-sm text-slate-600">{report.operator?.name || "N/D"}</div>
                                                    </TableCell>
                                                    <TableCell className="py-4 text-right font-mono font-bold text-slate-800">
                                                        {Number(report.totalMeters || 0).toFixed(1)}m
                                                    </TableCell>
                                                    <TableCell className="pr-8 py-4 text-right">
                                                        <UnifiedActionButtons
                                                            className="opacity-100"
                                                            editLink={(!report.status || report.status === 'PENDENTE') ? `/dashboard/bdp/${report.id}/edit` : undefined}
                                                            onDelete={(e) => handleDelete(report.id, e)}
                                                            onPrint={(e) => handleExport(report, e)}
                                                            isPrinting={generatingPdfId === report.id}
                                                        >
                                                            {(!report.status || report.status === 'PENDENTE') && (
                                                                <>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-9 px-3 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg font-bold gap-2"
                                                                        onClick={(e) => handleStatusUpdate(report.id, 'APROVADO', e)}
                                                                        title="Aprovar"
                                                                    >
                                                                        <CheckCircle className="h-4 w-4" />
                                                                        <span className="hidden lg:inline">Aprovar</span>
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-9 px-3 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg font-bold gap-2"
                                                                        onClick={(e) => handleStatusUpdate(report.id, 'REJEITADO', e)}
                                                                        title="Rejeitar"
                                                                    >
                                                                        <XCircle className="h-4 w-4" />
                                                                        <span className="hidden lg:inline">Rejeitar</span>
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </UnifiedActionButtons>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile List for this Project */}
                                <div className="md:hidden flex flex-col gap-3 p-4 bg-slate-50/50">
                                    {projectReports.map((report) => (
                                        <div key={report.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm active:scale-[0.99] transition-transform" onClick={() => router.push(`/dashboard/bdp/${report.id}`)}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">#{report.reportNumber}</span>
                                                    <span className="font-bold text-slate-800">{report.date ? format(new Date(report.date + 'T12:00:00'), "dd/MM/yy") : format(new Date(), "dd/MM/yy")}</span>
                                                </div>
                                                {getStatusBadge(report.status)}
                                            </div>
                                            <div className="flex justify-between items-end">
                                                <div className="flex flex-col gap-1">
                                                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" /> {report.drill?.name || "Sem Equip."}
                                                    </div>
                                                    <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> {report.shift}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-2xl font-black text-slate-900">{Number(report.totalMeters || 0).toFixed(0)}<span className="text-sm font-bold text-slate-400">m</span></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        )
                    })
                )}
            </div>
        </div>
    )
}
