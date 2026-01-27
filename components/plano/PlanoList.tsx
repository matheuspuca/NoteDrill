"use client"

import { useState } from "react"
import { Flame, CheckCircle2, Circle, Eye, Plus, HardHat, Projector } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { PlanoDeFogo } from "@/lib/schemas-plano"
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
import { finishPlano } from "@/app/dashboard/plano-de-fogo/plano-actions"
import { useToast } from "@/components/ui/use-toast"
import { PlanoFormDialog } from "./PlanoFormDialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface PlanoListProps {
    initialPlanos: any[]
    projects: { id: string; name: string }[]
}

export function PlanoList({ initialPlanos, projects }: PlanoListProps) {
    const { toast } = useToast()
    const [planos, setPlanos] = useState(initialPlanos)
    const [selectedProject, setSelectedProject] = useState<string>("all")
    const [isFinishing, setIsFinishing] = useState<string | null>(null)

    const filteredPlanos = selectedProject === "all"
        ? planos
        : planos.filter(p => p.project_id === selectedProject)

    const handleFinish = async (id: string) => {
        setIsFinishing(id)
        try {
            const result = await finishPlano(id)
            if (result.error) {
                toast({
                    variant: "destructive",
                    title: "Erro ao finalizar plano",
                    description: result.error,
                })
            } else {
                toast({
                    title: "Sucesso!",
                    description: "Plano de Fogo finalizado com sucesso.",
                })
                // Local update
                setPlanos(planos.map(p => p.id === id ? { ...p, status: "Concluído", finished_at: new Date().toISOString() } : p))
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro inesperado",
                description: "Ocorreu um erro ao tentar finalizar o plano.",
            })
        } finally {
            setIsFinishing(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger className="w-full sm:w-[250px] bg-white rounded-xl h-12 border-slate-200">
                            <div className="flex items-center gap-2">
                                <HardHat className="h-4 w-4 text-slate-400" />
                                <SelectValue placeholder="Filtrar por Obra" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as Obras</SelectItem>
                            {projects.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <PlanoFormDialog projects={projects} onSuccess={() => window.location.reload()} />
            </div>

            <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white ring-1 ring-slate-100">
                <CardHeader className="border-b border-slate-100 bg-white p-6 md:p-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-50 rounded-xl">
                            <Flame className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold text-slate-800">Planos de Fogo</CardTitle>
                            <CardDescription className="text-slate-500 font-medium">
                                Lista de planos de furação e detonação por obra.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow className="border-slate-100 hover:bg-transparent">
                                <TableHead className="pl-6 h-14 font-bold text-slate-500 text-xs uppercase tracking-wider">Identificação</TableHead>
                                <TableHead className="h-14 font-bold text-slate-500 text-xs uppercase tracking-wider">Obra / Projeto</TableHead>
                                <TableHead className="h-14 font-bold text-slate-500 text-xs uppercase tracking-wider">Status</TableHead>
                                <TableHead className="h-14 font-bold text-slate-500 text-xs uppercase tracking-wider">Criação</TableHead>
                                <TableHead className="pr-6 h-14 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPlanos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-slate-400 font-medium">
                                        <div className="flex flex-col items-center gap-2">
                                            <Flame className="h-8 w-8 text-slate-200" />
                                            <p>Nenhum plano encontrado.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPlanos.map((plano) => (
                                    <TableRow key={plano.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-6 py-5">
                                            <div className="font-bold text-slate-800 text-lg">{plano.name}</div>
                                            {plano.description && (
                                                <div className="text-sm text-slate-400 line-clamp-1 max-w-[300px] mt-0.5">
                                                    {plano.description}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <div className="flex items-center gap-2 text-slate-600 font-semibold">
                                                <HardHat className="h-4 w-4 text-slate-400" />
                                                {plano.projects?.name || "Obra não encontrada"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            {plano.status === "Concluído" ? (
                                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1 font-bold rounded-lg flex items-center gap-1.5 w-fit">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Concluído
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-orange-50 text-orange-700 border-orange-100 px-3 py-1 font-bold rounded-lg flex items-center gap-1.5 w-fit">
                                                    <Circle className="h-3.5 w-3.5" />
                                                    Em Aberto
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <div className="text-slate-600 font-medium">
                                                {format(new Date(plano.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {format(new Date(plano.created_at), "HH:mm", { locale: ptBR })}
                                            </div>
                                        </TableCell>
                                        <TableCell className="pr-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {plano.status === "Aberto" && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-bold h-9 rounded-lg"
                                                        onClick={() => handleFinish(plano.id)}
                                                        disabled={isFinishing === plano.id}
                                                    >
                                                        Finalizar
                                                    </Button>
                                                )}
                                                <Link href={`/dashboard/plano-de-fogo/${plano.id}`}>
                                                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold h-9 rounded-lg gap-2">
                                                        <Eye className="h-4 w-4" />
                                                        Detalhes
                                                    </Button>
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
