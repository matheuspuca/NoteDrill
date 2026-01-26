import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Flame, Calendar, MapPin, CheckCircle2, Circle, FileText, ChevronLeft, ArrowRight, Printer } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/navigation"
import { getPlanoDetails, finishPlano } from "../actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { revalidatePath } from "next/cache"

interface PlanoDetailsProps {
    params: { id: string }
}

export default async function PlanoDetailsPage({ params }: PlanoDetailsProps) {
    const { plano, bdps, error } = await getPlanoDetails(params.id)

    if (error || !plano) {
        notFound()
    }

    async function handleFinish() {
        "use server"
        await finishPlano(params.id)
    }

    return (
        <div className="p-6 lg:p-10 space-y-8">
            {/* Header / Breadcrumb alternative */}
            <div className="flex items-center gap-4 text-slate-500 mb-2">
                <a href="/dashboard/plano-de-fogo" className="flex items-center hover:text-orange-600 transition-colors">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Voltar para Planos
                </a>
            </div>

            <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-100 p-2 rounded-xl">
                                <Flame className="w-6 h-6 text-orange-600" />
                            </div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                                {plano.name}
                            </h1>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-slate-500">
                            <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-1 text-slate-400" />
                                <span className="font-bold text-slate-700">{plano.projects?.name}</span>
                            </div>
                            <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1 text-slate-400" />
                                {format(new Date(plano.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </div>
                            <Badge variant={plano.status === 'Concluído' ? 'default' : 'outline'} className={plano.status === 'Concluído' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>
                                {plano.status}
                            </Badge>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {plano.status === 'Aberto' && (
                            <form action={handleFinish}>
                                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white rounded-xl gap-2 h-12 px-6">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Finalizar Plano
                                </Button>
                            </form>
                        )}
                        <Button variant="outline" className="rounded-xl gap-2 h-12 px-6 border-slate-200 text-slate-600 hover:bg-slate-50">
                            <Printer className="w-5 h-5" />
                            Gerar Relatório de Medição
                        </Button>
                    </div>
                </div>

                {plano.description && (
                    <>
                        <Separator className="bg-slate-50" />
                        <div className="bg-slate-50 rounded-2xl p-4 text-slate-600 text-sm italic">
                            "{plano.description}"
                        </div>
                    </>
                )}
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        BDPs Vinculados ({bdps.length})
                    </h2>
                    {plano.status === 'Aberto' && (
                        <a href={`/dashboard/bdp/new?projectId=${plano.project_id}&planoId=${plano.id}`}>
                            <Button variant="ghost" className="text-blue-600 hover:bg-blue-50 gap-1 font-bold">
                                + Novo BDP para este plano
                            </Button>
                        </a>
                    )}
                </div>

                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Data</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Perfuratriz</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Operador</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider text-right">Prod. (m)</th>
                                <th className="px-6 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {bdps.map((bdp: any) => (
                                <tr key={bdp.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-700">
                                        {format(new Date(bdp.date + 'T12:00:00'), "dd/MM/yyyy")}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {bdp.equipment?.name || "-"}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {bdp.operator?.name || "-"}
                                    </td>
                                    <td className="px-6 py-4 text-slate-800 font-black text-right">
                                        {Number(bdp.total_meters || 0).toFixed(1)}m
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline" className={`
                                            ${bdp.status === 'APROVADO' ? 'text-green-600 border-green-200 bg-green-50' : ''}
                                            ${bdp.status === 'PENDENTE' ? 'text-amber-600 border-amber-200 bg-amber-50' : ''}
                                            ${bdp.status === 'REJEITADO' ? 'text-red-600 border-red-200 bg-red-50' : ''}
                                        `}>
                                            {bdp.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <a href={`/dashboard/bdp/${bdp.id}/edit`}>
                                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600">
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </a>
                                    </td>
                                </tr>
                            ))}

                            {bdps.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                                        Nenhum BDP vinculado a este plano ainda.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        {bdps.length > 0 && (
                            <tfoot>
                                <tr className="bg-slate-50/50">
                                    <td colSpan={3} className="px-6 py-4 font-bold text-slate-500 text-right">Total Perfurado:</td>
                                    <td className="px-6 py-4 font-black text-slate-800 text-right text-lg">
                                        {bdps.reduce((acc: number, b: any) => acc + (Number(b.total_meters) || 0), 0).toFixed(1)}m
                                    </td>
                                    <td colSpan={2}></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    )
}
