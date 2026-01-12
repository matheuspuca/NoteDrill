import { createClient } from "@/lib/supabase/server"
import { BDPForm } from "@/components/bdp/BDPForm"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default async function NewBDPPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div>Acesso negado.</div>
    }

    // Fetch necessary data for dropdowns
    // Fetch necessary data for dropdowns
    const { data: projects } = await supabase.from("projects").select("id, name").eq("user_id", user.id).order("name")
    const { data: teamMembers } = await supabase.from("team_members").select("id, name, role").eq("user_id", user.id).eq("status", "Ativo").order("name")
    const { data: equipments } = await supabase.from("equipment").select("id, name, type").eq("user_id", user.id).eq("status", "Operacional").order("name")
    // Fetch Inventory Items for Supplies (only consumable materials or others as needed)
    // Assuming 'type' column distinguishes or we just fetch all ACTIVE items
    const { data: inventoryItems } = await supabase.from("inventory_items").select("id, name, unit").eq("user_id", user.id).order("name")

    return (
        <div className="max-w-[1200px] mx-auto pb-20 pt-6">


            <div className="mb-10">
                <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Novo Boletim Diário (BDP)</h1>
                <p className="text-lg text-slate-500 mt-2 font-medium">Preencha os dados abaixo para gerar o relatório diário.</p>
            </div>

            <BDPForm
                projects={projects || []}
                teamMembers={teamMembers || []}
                equipments={equipments || []}
                inventoryItems={inventoryItems || []}
            />
        </div>
    )
}
