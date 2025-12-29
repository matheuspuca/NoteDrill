import { createClient } from "@/lib/supabase/server"
import { EquipmentForm } from "@/components/equipment/EquipmentForm"
import { redirect } from "next/navigation"

export default async function NewEquipmentPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return redirect("/login")

    return (
        <div className="max-w-5xl mx-auto py-10">
            <h1 className="text-4xl font-black text-slate-900 mb-8">Novo Equipamento</h1>
            <div className="bg-white p-8 rounded-2xl shadow-xl ring-1 ring-slate-100">
                <EquipmentForm />
            </div>
        </div>
    )
}
