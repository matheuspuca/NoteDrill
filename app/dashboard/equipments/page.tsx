import { createClient } from "@/lib/supabase/server"
import { EquipmentList } from "@/components/equipment/EquipmentList"
import { EquipmentKPIs } from "@/components/equipment/EquipmentKPIs"
// Force revalidation
import { Equipment } from "@/lib/schemas-equipment"
import { startOfMonth, endOfMonth, format, subHours } from "date-fns"
import { DateRangePicker } from "@/components/dashboard/DateRangePicker"

export default async function EquipmentsPage({
    searchParams,
}: {
    searchParams: { startDate?: string; endDate?: string }
}) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div>Acesso negado.</div>
    }

    // Date Filtering Logic (Consistent with Dashboard)
    const today = subHours(new Date(), 3)
    let startMonth: string
    let endMonth: string

    if (searchParams?.startDate && searchParams?.endDate) {
        startMonth = searchParams.startDate
        endMonth = searchParams.endDate
    } else {
        startMonth = format(startOfMonth(today), 'yyyy-MM-dd')
        endMonth = format(endOfMonth(today), 'yyyy-MM-dd')
    }

    // Parallel fetch: Equipments & BDP Reports (needed for KPIs) & Bits
    const [equipmentsResult, bdpResult, bitResult] = await Promise.all([
        supabase
            .from("equipment")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),

        supabase
            .from("bdp_reports")
            .select("drillId, totalMeters, startTime, endTime, occurrences, drill:equipment!drillId(name)")
            .eq("user_id", user.id)
            .gte("date", startMonth)
            .lte("date", endMonth),

        // Updated Bit Count Logic (Inventory Transactions)
        supabase
            .from("inventory_transactions")
            .select("quantity, item:inventory_items!inner(name), created_at")
            .eq("user_id", user.id)
            .eq("type", "OUT")
            .ilike("item.name", "%Bit%") // Filter by item name
            .gte("created_at", `${startMonth}T00:00:00`) // Assuming created_at is timestamp
            .lte("created_at", `${endMonth}T23:59:59`)
    ])

    const equipments = (equipmentsResult.data as Equipment[]) || []

    // Calculate Bit Count from transactions
    const bitTransactions = bitResult.data as any[] || []
    const bitCount = bitTransactions.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0)

    // Process BDP data to flatten drill name if needed for chart
    const productionData = (bdpResult.data || []).map((r: any) => ({
        ...r,
        drill: r.drill // Ensure drill relation is preserved
    }))

    return (
        <div className="max-w-[1600px] mx-auto py-10 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Equipamentos</h1>
                    <p className="text-lg text-slate-500 font-medium mt-2">
                        Gestão de frota, manutenção e controle de ativos.
                    </p>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                        📅 Filtro (Início/Fim): <span className="font-bold text-slate-600">{startMonth}</span> até <span className="font-bold text-slate-600">{endMonth}</span>
                    </p>
                </div>
                <DateRangePicker />
            </div>

            {equipmentsResult.error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                    Erro ao carregar equipamentos: {equipmentsResult.error.message}
                </div>
            )}

            <EquipmentKPIs equipments={equipments} productionData={productionData} bitCount={bitCount} />

            <EquipmentList equipments={equipments} />
        </div>
    )
}
