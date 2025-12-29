import { createClient } from "@/lib/supabase/server"
import { InventoryForm } from "@/components/inventory/InventoryForm"
import { Project } from "@/lib/schemas-project"
import { redirect } from "next/navigation"

export default async function NewInventoryItemPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return redirect("/login")

    // Fetch Projects for the dropdown
    const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true })

    return (
        <div className="max-w-4xl mx-auto py-10">
            <h1 className="text-3xl font-black text-slate-900 mb-8">Novo Item de Estoque</h1>
            <div className="bg-white p-8 rounded-2xl shadow-xl ring-1 ring-slate-100">
                <InventoryForm
                    projects={(projectsData as Project[]) || []}
                />
            </div>
        </div>
    )
}
