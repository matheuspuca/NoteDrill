import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { EquipmentForm } from "@/components/equipment/EquipmentForm"
import { MaintenanceList } from "@/components/equipment/MaintenanceList"
import { getMaintenanceEvents } from "@/app/dashboard/equipments/maintenance-actions"
import { Equipment, MaintenanceEvent } from "@/lib/schemas-equipment"

interface PageProps {
    params: {
        id: string
    }
}

export default async function EditEquipmentPage({ params }: PageProps) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return redirect("/login")

    // Fetch Equipment
    const { data: equipment } = await supabase
        .from("equipment")
        .select("*")
        .eq("id", params.id)
        .single()

    if (!equipment) return <div>Equipamento não encontrado.</div>

    // [v2.2] Fetch Maintenance History
    const maintenanceEvents = await getMaintenanceEvents(params.id)

    return (
        <div className="max-w-5xl mx-auto py-10 space-y-8">
            <div>
                <h1 className="text-4xl font-black text-slate-900 mb-8">Editar Equipamento</h1>
                <div className="bg-white p-8 rounded-2xl shadow-xl ring-1 ring-slate-100">
                    <EquipmentForm equipment={equipment as Equipment} />
                </div>
            </div>

            {/* [v2.2] Maintenance Section */}
            <div className="bg-white p-8 rounded-2xl shadow-xl ring-1 ring-slate-100">
                <MaintenanceList
                    equipmentId={params.id}
                    events={maintenanceEvents as MaintenanceEvent[]}
                />
            </div>
        </div>
    )
}
