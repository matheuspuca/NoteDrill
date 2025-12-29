import { createClient } from "@/lib/supabase/server"
import { BDPList } from "@/components/bdp/BDPList"
import { BDPKPIs } from "@/components/bdp/BDPKPIs"
import { BDP } from "@/lib/schemas-bdp"

export default async function BDPPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div>Acesso negado.</div>
    }

    // Fetch reports with joined relations for display
    const { data: reports, error } = await supabase
        .from("bdp_reports")
        .select(`
            *,
            projects (name),
            drill:equipment!drillId (name),
            operator:team_members!operatorId (name)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    // Map relations to flat structure expected by BDP type
    const formattedReports = (reports || []).map((r: any) => ({
        ...r,
        projects: r.projects,
        operator: r.operator,
        drill: r.drill
    }))

    return (
        <div className="space-y-8 max-w-[1800px] mx-auto pb-10 pt-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Apontamento Diário (BDP)</h1>
                    <p className="text-lg text-slate-500 mt-2 font-medium">Controle de produção e reporte diário de perfuração.</p>
                </div>
            </div>

            <BDPKPIs />

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600">
                    <p className="font-bold">Erro ao carregar dados:</p>
                    <pre className="text-xs mt-2">{JSON.stringify(error, null, 2)}</pre>
                </div>
            )}

            <BDPList reports={(formattedReports as BDP[]) || []} />
        </div>
    )
}
