import { createClient } from "@/lib/supabase/server"
import { BDPList } from "@/components/bdp/BDPList"
import { BDPKPIs } from "@/components/bdp/BDPKPIs"
import { BDP } from "@/lib/schemas-bdp"

export const dynamic = "force-dynamic"

export default async function BDPPage({ searchParams }: { searchParams: { startDate?: string; endDate?: string } }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div>Acesso negado.</div>
    }

    // Build Query
    let query = supabase
        .from("bdp_reports")
        .select(`
            *,
            projects (name),
            drill:equipment!drillId (name),
            operator:team_members!operatorId (name)
        `)
        .eq("user_id", user.id)

    // Fetch Company Settings for Reports
    const { data: companySettings } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()

    // Apply date filters if present
    if (searchParams.startDate) {
        query = query.gte("date", searchParams.startDate)
    }
    if (searchParams.endDate) {
        query = query.lte("date", searchParams.endDate)
    }

    const { data: reports, error } = await query.order("created_at", { ascending: false })

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

            <BDPKPIs reports={(formattedReports as BDP[]) || []} />

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600">
                    <p className="font-bold">Erro ao carregar dados:</p>
                    <pre className="text-xs mt-2">{JSON.stringify(error, null, 2)}</pre>
                </div>
            )}

            <BDPList
                reports={(formattedReports as BDP[]) || []}
                companySettings={companySettings}
            />
        </div>
    )
}
