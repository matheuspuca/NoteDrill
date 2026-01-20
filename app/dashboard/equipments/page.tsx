import { createClient } from "@/lib/supabase/server"
import { EquipmentList } from "@/components/equipment/EquipmentList"
import { EquipmentKPIs } from "@/components/equipment/EquipmentKPIs"
// Force revalidation
import { Equipment } from "@/lib/schemas-equipment"
import { startOfMonth, endOfMonth, format, subHours } from "date-fns"
import { EquipmentFilters } from "@/components/equipment/EquipmentFilters"

export default async function EquipmentsPage({
    searchParams,
}: {
    searchParams: { startDate?: string; endDate?: string; equipmentId?: string; projectId?: string }
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

    const selectedEquipmentId = searchParams?.equipmentId
    const selectedProjectId = searchParams?.projectId && searchParams.projectId !== 'all' ? searchParams.projectId : null

    // 1. Fetch ALL equipments for the selector and list
    const { data: allEquipmentsData, error: equipmentsError } = await supabase
        .from("equipment")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    const allEquipments = (allEquipmentsData as Equipment[]) || []

    // Fetch Projects for Filter
    const { data: projectsData } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name")

    const projects = projectsData || []

    // 2. Prepare queries for KPIs (Production & Bits)
    let bdpQuery = supabase
        .from("bdp_reports")
        .select("drill_id, total_meters, start_time, end_time, occurrences, drill:equipment!drill_id(name), project_id")
        .eq("user_id", user.id)
        .gte("date", startMonth)
        .lte("date", endMonth)

    let bitQuery = supabase
        .from("inventory_transactions")
        .select("quantity, item:inventory_items!inner(name, project_id), created_at")
        .eq("user_id", user.id)
        .eq("type", "OUT")
        .ilike("item.name", "%Bit%") // Filter by item name
        .gte("created_at", `${startMonth}T00:00:00`)
        .lte("created_at", `${endMonth}T23:59:59`)

    // 3. Apply Equipment Filter
    let filteredEquipments = allEquipments

    if (selectedEquipmentId) {
        bdpQuery = bdpQuery.eq("drill_id", selectedEquipmentId)
        bitQuery = bitQuery.eq("equipment_id", selectedEquipmentId)
        filteredEquipments = allEquipments.filter(e => e.id === selectedEquipmentId)
    }

    // 4. Apply Project Filter
    if (selectedProjectId) {
        bdpQuery = bdpQuery.eq("project_id", selectedProjectId)
        bitQuery = bitQuery.eq("item.project_id", selectedProjectId) // Filter bits by project via item
    }

    // 5. Executa queries
    const [bdpResult, bitResult] = await Promise.all([
        bdpQuery,
        bitQuery
    ])

    // Calculate Bit Count from transactions
    const bitTransactions = bitResult.data as any[] || []
    const bitCount = bitTransactions.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0)

    // Process BDP data to flatten drill name if needed for chart
    const productionData = (bdpResult.data || []).map((r: any) => ({
        drillId: r.drill_id,
        totalMeters: r.total_meters,
        startTime: r.start_time,
        endTime: r.end_time,
        occurrences: r.occurrences,
        drill: r.drill // Ensure drill relation is preserved
    }))

    return (
        <div className="max-w-[1600px] mx-auto py-10 space-y-8">
            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Equipamentos</h1>
                    <p className="text-lg text-slate-500 font-medium mt-2">
                        Gestão de frota, manutenção e controle de ativos.
                    </p>
                </div>

                <EquipmentFilters projects={projects} equipments={allEquipments} />
            </div>

            {equipmentsError && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                    Erro ao carregar equipamentos: {equipmentsError.message}
                </div>
            )}

            <EquipmentKPIs equipments={filteredEquipments} productionData={productionData} bitCount={bitCount} />

            <EquipmentList equipments={filteredEquipments} />
        </div>
    )
}
