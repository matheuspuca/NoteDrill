import { createClient } from "@/lib/supabase/server"
import { EquipmentList } from "@/components/equipment/EquipmentList"
import { EquipmentKPIs } from "@/components/equipment/EquipmentKPIs"
// Force revalidation
import { Equipment } from "@/lib/schemas-equipment"

export default async function EquipmentsPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div>Acesso negado.</div>
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
            .eq("user_id", user.id),

        // Updated Bit Count Logic (Inventory Transactions)
        supabase
            .from("inventory_transactions")
            .select("quantity, item:inventory_items!inner(name)")
            .eq("user_id", user.id)
            .eq("type", "OUT")
            .ilike("item.name", "%Bit%") // Filter by item name
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
            <div>
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Equipamentos</h1>
                <p className="text-lg text-slate-500 font-medium mt-2">
                    Gestão de frota, manutenção e controle de ativos.
                </p>
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
