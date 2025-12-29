import { createClient } from "@/lib/supabase/server"
import { EquipmentList } from "@/components/equipment/EquipmentList"
// Force revalidation
import { Equipment } from "@/lib/schemas-equipment"

export default async function EquipmentsPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div>Acesso negado.</div>
    }

    const { data: equipments, error } = await supabase
        .from("equipment")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    return (
        <div className="max-w-[1600px] mx-auto py-10 space-y-8">
            <div>
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Equipamentos</h1>
                <p className="text-lg text-slate-500 font-medium mt-2">
                    Gestão de frota, manutenção e controle de ativos.
                </p>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                    Erro ao carregar equipamentos: {error.message}
                </div>
            )}

            <EquipmentList equipments={(equipments as Equipment[]) || []} />
        </div>
    )
}
