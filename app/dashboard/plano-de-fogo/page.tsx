import { createClient } from "@/lib/supabase/server"
import { Flame, Calendar, MapPin, CheckCircle2, Circle } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlanoFormDialog } from "@/components/plano/PlanoFormDialog"

export default async function PlanoDeFogoPage() {
    const supabase = createClient()

    // Fetch projects for the dialog
    const { data: projects } = await supabase.from("projects").select("id, name").order("name")

    // Fetch all planos with project info
    const { data: planos } = await supabase
        .from("plano_de_fogo")
        .select(`
            *,
            projects(name)
        `)
        .order("created_at", { ascending: false })

    return (
        <div className="p-6 lg:p-10 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">
                        Planos de Fogo
                    </h1>
                    <p className="text-slate-500">
                        Gerencie as furações e vincule os boletins diários.
                    </p>
                </div>
                <PlanoFormDialog projects={projects || []} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {planos?.map((plano) => (
                    <Link key={plano.id} href={`/dashboard/plano-de-fogo/${plano.id}`}>
                        <div className="group bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all cursor-pointer">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-orange-50 p-3 rounded-2xl group-hover:bg-orange-600 transition-colors">
                                    <Flame className="w-6 h-6 text-orange-600 group-hover:text-white" />
                                </div>
                                <Badge variant={plano.status === 'Concluído' ? 'default' : 'outline'} className={plano.status === 'Concluído' ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100' : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50'}>
                                    {plano.status === 'Concluído' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <Circle className="w-3 h-3 mr-1" />}
                                    {plano.status}
                                </Badge>
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-orange-600 transition-colors">
                                {plano.name}
                            </h3>

                            <div className="flex items-center text-slate-500 text-sm mb-4">
                                <MapPin className="w-4 h-4 mr-1 text-slate-400" />
                                {plano.projects?.name}
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                <div>
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Criado em</span>
                                    <div className="flex items-center text-slate-700 font-medium">
                                        <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                                        {format(new Date(plano.created_at), "dd/MM/yy", { locale: ptBR })}
                                    </div>
                                </div>
                                {plano.finished_at && (
                                    <div>
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Finalizado em</span>
                                        <div className="flex items-center text-slate-700 font-medium">
                                            <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
                                            {format(new Date(plano.finished_at), "dd/MM/yy", { locale: ptBR })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}

                {!planos?.length && (
                    <div className="col-span-full py-20 bg-slate-50 rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                        <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                            <Flame className="w-12 h-12 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-400">Nenhum plano de fogo encontrado</h3>
                        <p className="text-slate-400 max-w-xs mt-2">
                            Crie seu primeiro plano de fogo para começar a agrupar seus BDPs.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
