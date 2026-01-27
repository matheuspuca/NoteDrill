"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    FileText,
    Pencil,
    Trash2,
    Loader2,
    ChevronLeft,
    Flame,
    Download
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { deletePlano } from "@/app/dashboard/plano-de-fogo/plano-actions"
import { useToast } from "@/components/ui/use-toast"
import { PlanoFormDialog } from "./PlanoFormDialog"
import { generateMeasurementPDF } from "@/components/bdp/generate-measurement-pdf"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface PlanoDetailsActionsProps {
    plano: any
    bdps: any[]
    projects: any[]
    companySettings?: any
}

export function PlanoDetailsActions({ plano, bdps, projects, companySettings }: PlanoDetailsActionsProps) {
    const [isDeleting, setIsDeleting] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const { toast } = useToast()
    const router = useRouter()

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const result = await deletePlano(plano.id)
            if (result.error) {
                toast({
                    variant: "destructive",
                    title: "Erro ao excluir",
                    description: result.error,
                })
            } else {
                toast({
                    title: "Sucesso!",
                    description: "Plano de Fogo excluído com sucesso.",
                })
                router.push("/dashboard/plano-de-fogo")
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro inesperado",
                description: "Ocorreu um erro ao tentar excluir o plano.",
            })
        } finally {
            setIsDeleting(false)
        }
    }

    const handleGenerateMeasurement = async () => {
        if (bdps.length === 0) {
            toast({
                variant: "destructive",
                title: "Sem dados",
                description: "Não há BDPs vinculados para gerar medição.",
            })
            return
        }

        setIsGenerating(true)
        try {
            // Map BDPs to the format expected by generateMeasurementPDF
            const mappedReports = bdps.map(b => ({
                ...b,
                totalMeters: b.total_meters,
                totalHours: b.total_hours,
                reportNumber: b.report_number,
                drillId: b.drill_id,
                operatorId: b.operator_id,
            }))

            await generateMeasurementPDF(
                mappedReports as any,
                plano.projects?.name || "Obra",
                companySettings
            )

            toast({
                title: "Sucesso!",
                description: "Medição gerada com sucesso.",
            })
        } catch (error) {
            console.error(error)
            toast({
                variant: "destructive",
                title: "Erro ao gerar PDF",
                description: "Ocorreu um erro ao gerar o arquivo de medição.",
            })
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between mb-8">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/plano-de-fogo">
                    <Button variant="ghost" size="icon" className="bg-white shadow-sm border border-slate-200 rounded-xl hover:bg-slate-50">
                        <ChevronLeft className="w-6 h-6 text-slate-500" />
                    </Button>
                </Link>
                <div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
                            {plano.name}
                        </h1>
                        <div className={`px-3 py-1 rounded-lg font-bold text-sm ${plano.status === 'Concluído'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                            {plano.status}
                        </div>
                    </div>
                    <p className="text-lg text-slate-500 mt-2 font-medium">Detalhes do Plano de Fogo e execução</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                {/* Measurement PDF */}
                <Button
                    onClick={handleGenerateMeasurement}
                    disabled={isGenerating}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2 font-bold h-12 shadow-md shadow-emerald-100"
                >
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                    Gerar Medição
                </Button>

                {/* Edit */}
                <PlanoFormDialog
                    projects={projects}
                    initialData={{
                        id: plano.id,
                        name: plano.name,
                        projectId: plano.project_id,
                        description: plano.description
                    }}
                    onSuccess={() => window.location.reload()}
                    trigger={
                        <Button variant="outline" className="border-slate-200 text-slate-600 rounded-xl gap-2 font-bold h-12 bg-white hover:bg-slate-50">
                            <Pencil className="w-4 h-4" />
                            Editar
                        </Button>
                    }
                />

                {/* Delete */}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" className="border-red-100 text-red-600 rounded-xl gap-2 font-bold h-12 bg-red-50 hover:bg-red-100">
                            <Trash2 className="w-4 h-4" />
                            Excluir
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-[32px] p-8 border-none shadow-2xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-2xl font-bold text-slate-800">Tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-medium">
                                Esta ação não pode ser desfeita. O plano será permanentemente excluído.
                                {bdps.length > 0 && (
                                    <span className="block mt-2 font-bold text-red-600">
                                        Aviso: Este plano possui {bdps.length} BDPs vinculados. Você deve desvinculá-los antes de excluir.
                                    </span>
                                )}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-3 mt-6">
                            <AlertDialogCancel className="rounded-xl h-12 font-bold border-slate-200">Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 font-bold shadow-lg shadow-red-200"
                            >
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Sim, Excluir
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                <Link href={`/dashboard/bdp/new?projectId=${plano.project_id}&planoId=${plano.id}`}>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl gap-2 font-bold h-12">
                        <FileText className="w-5 h-5" />
                        Novo BDP
                    </Button>
                </Link>
            </div>
        </div>
    )
}
