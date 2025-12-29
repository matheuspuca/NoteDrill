import { createClient } from "@/lib/supabase/server"
import { InventoryForm } from "@/components/inventory/InventoryForm"
import { Project } from "@/lib/schemas-project"
import { InventoryItem } from "@/lib/schemas-inventory"
import { redirect } from "next/navigation"

interface PageProps {
    params: {
        id: string
    }
}

export default async function EditInventoryItemPage({ params }: PageProps) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return redirect("/login")

    // Fetch Projects
    const { data: projectsData } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true })

    // Fetch Item
    const { data: item } = await supabase
        .from("inventory_items")
        .select("*")
        .eq("id", params.id)
        .single()

    if (!item) return <div>Item não encontrado.</div>

    return (
        <div className="max-w-4xl mx-auto py-10">
            <h1 className="text-3xl font-black text-slate-900 mb-8">Editar Item</h1>
            <div className="bg-white p-8 rounded-2xl shadow-xl ring-1 ring-slate-100">
                <InventoryForm
                    item={item as InventoryItem}
                    projects={(projectsData as Project[]) || []}
                />
            </div>
        </div>
    )
}
