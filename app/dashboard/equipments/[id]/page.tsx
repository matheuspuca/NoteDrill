import { createClient } from "@/lib/supabase/server"
import { EquipmentForm } from "@/components/equipment/EquipmentForm"
import { Equipment } from "@/lib/schemas-equipment"
import { redirect } from "next/navigation"

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

    return (
        <div className="max-w-5xl mx-auto py-10">
            <h1 className="text-4xl font-black text-slate-900 mb-8">Editar Equipamento</h1>
            <div className="bg-white p-8 rounded-2xl shadow-xl ring-1 ring-slate-100">
                <EquipmentForm equipment={equipment as Equipment} />
            </div>
        </div>
    )
}
