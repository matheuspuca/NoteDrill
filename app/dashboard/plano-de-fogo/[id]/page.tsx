import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ChevronLeft, Calendar, Clock, User, HardHat, Drill, FileText, AlertCircle, Package } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function PlanoFogoDetailPage({ params }: { params: { id: string } }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // Fetch BDP Report with relations
    const { data: bdp, error } = await supabase
        .from("bdp_reports")
        .select(`
            *,
            projects:project_id(id, name),
            operator:operator_id(id, name),
            drill:drill_id(id, name),
            plano_de_fogo:plano_de_fogo_id(id, name)
        `)
        .eq("id", params.id)
        .eq("user_id", user.id)
        .single()

    if (error || !bdp) {
        redirect("/dashboard/plano-de-fogo")
    }

    const statusColors = {
        PENDENTE: "bg-yellow-100 text-yellow-800 border-yellow-200",
        APROVADO: "bg-green-100 text-green-800 border-green-200",
        REJEITADO: "bg-red-100 text-red-800 border-red-200"
    }

    return (
        <div className="max-w-[1400px] mx-auto pb-20 pt-6 px-4">
            {/* Header */}
            <div className="mb-8 flex items-center gap-4">
                <Link href="/dashboard/plano-de-fogo">
                    <button className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors">
                        <ChevronLeft className="w-6 h-6 text-slate-500" />
                    </button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
                            Plano de Fogo
                        </h1>
                        <span className="text-slate-400 font-mono text-2xl">#{bdp.report_number}</span>
                        <Badge className={`${statusColors[bdp.status as keyof typeof statusColors] || statusColors.PENDENTE} font-bold`}>
                            {bdp.status || "PENDENTE"}
                        </Badge>
                    </div>
                    <p className="text-lg text-slate-500 mt-2 font-medium">Detalhes do registro de perfuração</p>
                </div>
                {(!bdp.status || bdp.status === 'PENDENTE') && (
                    <Link href={`/dashboard/plano-de-fogo/${params.id}/edit`}>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                            Editar
                        </Button>
                    </Link>
                )}
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="border-none shadow-md bg-white rounded-2xl">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold text-slate-500 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Data e Turno
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-black text-slate-800">
                            {bdp.date ? format(new Date(bdp.date), "dd/MM/yyyy", { locale: ptBR }) : "-"}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">{bdp.shift || "-"}</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white rounded-2xl">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold text-slate-500 flex items-center gap-2">
                            <HardHat className="w-4 h-4" />
                            Projeto
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-black text-slate-800">
                            {bdp.projects?.name || "-"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white rounded-2xl">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold text-slate-500 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Operador
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-black text-slate-800">
                            {bdp.operator?.name || "-"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white rounded-2xl">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-bold text-slate-500 flex items-center gap-2">
                            <Drill className="w-4 h-4" />
                            Equipamento
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xl font-black text-slate-800">
                            {bdp.drill?.name || "-"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Production Summary */}
            <Card className="border-none shadow-lg bg-white rounded-2xl mb-8">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-800">Resumo de Produção</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm font-bold text-slate-500 mb-2">Total Perfurado</p>
                            <p className="text-3xl font-black text-blue-600">{bdp.total_meters || 0}m</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 mb-2">Horas Trabalhadas</p>
                            <p className="text-3xl font-black text-green-600">{bdp.total_hours || 0}h</p>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 mb-2">Produtividade</p>
                            <p className="text-3xl font-black text-orange-600">
                                {bdp.total_hours > 0 ? (bdp.total_meters / bdp.total_hours).toFixed(1) : "0.0"} m/h
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Services */}
            {bdp.services && bdp.services.length > 0 && (
                <Card className="border-none shadow-lg bg-white rounded-2xl mb-8">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-slate-800">Serviços Executados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {bdp.services.map((service: any, idx: number) => (
                                <div key={idx} className="p-4 bg-slate-50 rounded-xl">
                                    <h3 className="font-bold text-slate-800 mb-2">{service.serviceType}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-slate-500">Furos:</span>
                                            <span className="ml-2 font-bold">{service.holeCount || 0}</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Diâmetro:</span>
                                            <span className="ml-2 font-bold">{service.diameter || "-"}"</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Ângulo:</span>
                                            <span className="ml-2 font-bold">{service.angle || "-"}°</span>
                                        </div>
                                        <div>
                                            <span className="text-slate-500">Azimute:</span>
                                            <span className="ml-2 font-bold">{service.azimuth || "-"}°</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Occurrences */}
            {bdp.occurrences && bdp.occurrences.length > 0 && (
                <Card className="border-none shadow-lg bg-white rounded-2xl mb-8">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                            Ocorrências
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {bdp.occurrences.map((occ: any, idx: number) => (
                                <div key={idx} className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                                    <p className="font-bold text-slate-800">{occ.type}</p>
                                    <p className="text-sm text-slate-600 mt-1">{occ.description}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Supplies */}
            {bdp.supplies && bdp.supplies.length > 0 && (
                <Card className="border-none shadow-lg bg-white rounded-2xl">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-500" />
                            Insumos Utilizados
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {bdp.supplies.map((supply: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                    <div>
                                        <p className="font-bold text-slate-800">{supply.type}</p>
                                        <p className="text-sm text-slate-600">{supply.itemName}</p>
                                    </div>
                                    <p className="text-lg font-black text-blue-600">
                                        {supply.quantity} {supply.unit}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
