import { createClient } from "@/lib/supabase/server"
import { getPlanoDetails } from "../plano-actions"
import { redirect } from "next/navigation"
import { Flame, Calendar, HardHat, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlanoDetailsActions } from "@/components/plano/PlanoDetailsActions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function PlanoDetailPage({ params }: { params: { id: string } }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const result = await getPlanoDetails(params.id)

    if (result.error || !result.data) {
        redirect("/dashboard/plano-de-fogo")
    }

    const { plano, bdps } = result.data

    // Fetch projects for editing
    const { data: projects } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name")

    // Fetch company settings for PDF reports
    const { data: companySettings } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()

    return (
        <div className="max-w-[1400px] mx-auto pb-20 pt-6 px-4">
            {/* Action Header */}
            <PlanoDetailsActions
                plano={plano}
                bdps={bdps || []}
                projects={projects || []}
                companySettings={companySettings}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-none shadow-xl rounded-3xl bg-white ring-1 ring-slate-100">
                        <CardHeader className="border-b border-slate-100">
                            <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Flame className="w-5 h-5 text-orange-500" />
                                Informações do Plano
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Obra / Projeto</label>
                                <div className="flex items-center gap-2 text-slate-700 font-bold text-lg">
                                    <HardHat className="w-5 h-5 text-slate-400" />
                                    {plano.projects?.name}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Criação</label>
                                    <div className="flex items-center gap-2 text-slate-700 font-bold">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        {format(new Date(plano.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                    </div>
                                </div>
                                {plano.finished_at && (
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Finalizado em</label>
                                        <div className="flex items-center gap-2 text-emerald-600 font-bold">
                                            <CheckCircle2 className="w-4 h-4" />
                                            {format(new Date(plano.finished_at), "dd/MM/yyyy", { locale: ptBR })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {plano.description && (
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Observações</label>
                                    <p className="text-slate-600 font-medium whitespace-pre-wrap rounded-xl bg-slate-50 p-4 border border-slate-100">
                                        {plano.description}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Stats Summary */}
                    <Card className="border-none shadow-xl rounded-3xl bg-slate-900 text-white overflow-hidden">
                        <CardContent className="p-8">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-1">BDPs Vinculados</p>
                                    <p className="text-5xl font-black">{bdps?.length || 0}</p>
                                </div>
                                <div className="h-px bg-white/10" />
                                <div>
                                    <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-1">Total Metros Perfurados</p>
                                    <p className="text-4xl font-black text-blue-400">
                                        {bdps?.reduce((acc: number, b: any) => acc + (b.total_meters || 0), 0).toFixed(1)}m
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: BDP List */}
                <div className="lg:col-span-2">
                    <Card className="border-none shadow-xl rounded-3xl bg-white ring-1 ring-slate-100 h-full overflow-hidden">
                        <CardHeader className="border-b border-slate-100 p-8">
                            <CardTitle className="text-2xl font-bold text-slate-800">Boletins Diários (BDP)</CardTitle>
                            <CardDescription className="text-slate-500 font-medium">Relatórios de execução vinculados a este plano de fogo.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="border-slate-100">
                                        <TableHead className="pl-8 h-14 font-bold text-slate-500 uppercase text-xs tracking-wider">BDP</TableHead>
                                        <TableHead className="h-14 font-bold text-slate-500 uppercase text-xs tracking-wider">Data / Turno</TableHead>
                                        <TableHead className="h-14 font-bold text-slate-500 uppercase text-xs tracking-wider">Perfuratriz</TableHead>
                                        <TableHead className="h-14 font-bold text-slate-500 uppercase text-xs tracking-wider text-right">Metragem</TableHead>
                                        <TableHead className="pr-8 h-14 font-bold text-slate-500 uppercase text-xs tracking-wider text-right">Ação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bdps?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-48 text-center text-slate-400 font-medium">
                                                Nenhum BDP vinculado ainda.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        bdps.map((bdp: any) => (
                                            <TableRow key={bdp.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="pl-8 py-5">
                                                    <span className="font-mono text-sm font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">#{bdp.report_number}</span>
                                                </TableCell>
                                                <TableCell className="py-5">
                                                    <div className="font-bold text-slate-700">{format(new Date(bdp.date + 'T12:00:00'), "dd/MM/yyyy")}</div>
                                                    <div className="text-xs text-slate-400">{bdp.shift}</div>
                                                </TableCell>
                                                <TableCell className="py-5 font-medium text-slate-600">
                                                    {bdp.drill?.name || "N/D"}
                                                </TableCell>
                                                <TableCell className="py-5 text-right font-black text-slate-800">
                                                    {bdp.total_meters?.toFixed(1)}m
                                                </TableCell>
                                                <TableCell className="pr-8 py-5 text-right">
                                                    <Link href={`/dashboard/bdp/${bdp.id}`}>
                                                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 font-bold">Ver</Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
