"use client"

import { useState } from "react"
import { Edit, Trash2, Plus, HardHat, ExternalLink, Calendar, MapPin } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { ProjectForm } from "@/components/projects/ProjectForm"
import { DeleteProjectDialog } from "@/components/projects/DeleteProjectDialog"
import { deleteProject } from "@/app/dashboard/projects/actions"
import { useToast } from "@/components/ui/use-toast"

interface ProjectListProps {
    projects: Project[]
}

const statusConfig: Record<string, { color: string; label: string }> = {
    Produção: { color: "bg-green-100 text-green-700 border-green-200", label: "Em Produção" },
    Planejamento: { color: "bg-blue-100 text-blue-700 border-blue-200", label: "Planejamento" },
    Parada: { color: "bg-red-100 text-red-700 border-red-200", label: "Parada" },
    Concluída: { color: "bg-slate-100 text-slate-700 border-slate-200", label: "Concluída" },
}

export function ProjectList({ projects }: ProjectListProps) {
    const { toast } = useToast()
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleEdit = (project: Project) => {
        setEditingProject(project)
        setIsSheetOpen(true)
    }

    const handleDeleteClick = (project: Project) => {
        setProjectToDelete(project)
    }

    const confirmDelete = async () => {
        if (!projectToDelete) return

        setIsDeleting(true)
        try {
            const result = await deleteProject(projectToDelete.id)
            if (result.error) {
                toast({
                    variant: "destructive",
                    title: "Erro ao excluir",
                    description: result.error,
                })
            } else {
                toast({
                    title: "Obra excluída",
                    description: "A obra foi removida com sucesso.",
                })
                setProjectToDelete(null)
            }
        } catch (error) {
            console.error(error)
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Ocorreu um erro ao excluir a obra.",
            })
        } finally {
            setIsDeleting(false)
        }
    }

    const handleSheetOpenChange = (open: boolean) => {
        setIsSheetOpen(open)
        if (!open) setEditingProject(null)
    }

    const handleSuccess = () => {
        setIsSheetOpen(false)
        setEditingProject(null)
    }

    return (
        <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
                {/* Visual Spacer / Title Area if needed later */}
                <div className="hidden sm:block"></div>
                <Button
                    onClick={() => setIsSheetOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 rounded-2xl h-16 px-10 text-xl font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                >
                    <Plus className="h-7 w-7" /> Nova Obra
                </Button>
            </div>

            <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-white ring-1 ring-slate-100">
                <CardHeader className="border-b border-slate-100 bg-white p-10">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-blue-50 rounded-2xl ring-1 ring-blue-100">
                            <HardHat className="h-10 w-10 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-black text-slate-800 tracking-tight">Lista de Obras</CardTitle>
                            <CardDescription className="text-slate-500 font-medium mt-2 text-lg">
                                Gerencie todos os seus projetos ativos e arquivados em um só lugar.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-sm">
                            <TableRow className="border-slate-100 hover:bg-transparent">
                                <TableHead className="pl-10 h-20 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em]">Projeto / Obra</TableHead>
                                <TableHead className="h-20 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em]">Status</TableHead>
                                <TableHead className="h-20 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em]">Localização</TableHead>
                                <TableHead className="h-20 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em]">Responsável</TableHead>
                                <TableHead className="h-20 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em]">Cronograma</TableHead>
                                <TableHead className="pr-10 h-20 font-extrabold text-slate-500 text-xs uppercase tracking-[0.15em] text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center text-slate-400 font-medium text-xl">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="bg-slate-50 p-6 rounded-full">
                                                <HardHat className="h-12 w-12 text-slate-300" />
                                            </div>
                                            <p>Nenhuma obra encontrada. Clique em "Nova Obra" para começar.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                projects.map((project) => {
                                    const status = statusConfig[project.status as any] || statusConfig["Planejamento"]

                                    return (
                                        <TableRow key={project.id} className="border-slate-50 hover:bg-blue-50/40 transition-all duration-200 group cursor-pointer">
                                            <TableCell className="pl-10 py-8">
                                                <div className="font-black text-slate-800 text-xl tracking-tight group-hover:text-blue-700 transition-colors">
                                                    {project.name}
                                                </div>
                                                <div className="text-sm text-slate-400 font-semibold flex items-center gap-2 mt-2">
                                                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs font-mono border border-slate-200">
                                                        #{project.id.slice(0, 6).toUpperCase()}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-8">
                                                <Badge variant="outline" className={`border-2 ${status.color} px-5 py-2 font-extrabold rounded-full text-sm uppercase tracking-wide`}>
                                                    {status.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-8">
                                                <div className="flex items-center gap-3 text-slate-700 font-bold text-lg">
                                                    <div className="bg-orange-50 p-2 rounded-lg">
                                                        <MapPin className="h-5 w-5 text-orange-500" />
                                                    </div>
                                                    {project.city}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-8">
                                                <div className="font-bold text-slate-700 text-lg">
                                                    {project.responsible_engineer || "-"}
                                                </div>
                                                {project.responsible_phone && (
                                                    <div className="text-sm text-slate-400 font-medium mt-1 pl-1 border-l-2 border-slate-200">{project.responsible_phone}</div>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-8">
                                                {project.start_date ? (
                                                    <div className="flex items-center gap-3 text-lg text-slate-700 font-bold">
                                                        <div className="bg-green-50 p-2 rounded-lg">
                                                            <Calendar className="h-5 w-5 text-green-600" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span>{format(new Date(project.start_date), "dd MMM, yy", { locale: ptBR })}</span>
                                                            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Início</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-base font-medium opacity-50">Não definido</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="pr-10 py-8 text-right">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-12 w-12 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-xl transition-all hover:scale-110"
                                                        onClick={(e) => { e.stopPropagation(); handleEdit(project) }}
                                                    >
                                                        <Edit className="h-6 w-6" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-12 w-12 text-red-500 hover:text-red-600 hover:bg-red-100 rounded-xl transition-all hover:scale-110"
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteClick(project) }}
                                                    >
                                                        <Trash2 className="h-6 w-6" />
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

            <Sheet open={isSheetOpen} onOpenChange={handleSheetOpenChange}>
                <SheetContent className="sm:max-w-[800px] w-full p-0 gap-0 bg-white border-l border-slate-100 shadow-2xl transition-all duration-500 ease-in-out">
                    <SheetHeader className="px-12 py-10 border-b border-slate-100 bg-slate-50/80 backdrop-blur-md">
                        <SheetTitle className="text-4xl font-black text-slate-900 tracking-tight">
                            {editingProject ? "Editar Projeto" : "Novo Projeto"}
                        </SheetTitle>
                        <SheetDescription className="text-slate-500 text-xl mt-3 font-medium">
                            {editingProject
                                ? "Atualize as informações críticas da obra abaixo."
                                : "Preencha os dados necessários para iniciar um novo controle de obra."}
                        </SheetDescription>
                    </SheetHeader>
                    <div className="px-12 py-10 overflow-y-auto h-[calc(100vh-180px)] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        <ProjectForm project={editingProject || undefined} onSuccess={handleSuccess} />
                    </div>
                </SheetContent>
            </Sheet>

            <DeleteProjectDialog
                open={!!projectToDelete}
                onOpenChange={(open) => !open && setProjectToDelete(null)}
                onConfirm={confirmDelete}
                isDeleting={isDeleting}
            />
        </>
    )
}
