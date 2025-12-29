import { createClient } from "@/lib/supabase/server"
import { InventoryList } from "@/components/inventory/InventoryList"
import { InventoryItem } from "@/lib/schemas-inventory"
import { Project } from "@/lib/schemas-project"

export default async function InventoryPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Acesso negado.</div>

    // Fetch Inventory data joined with Project names
    const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory_items")
        .select(`*, projects (name)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    // Fetch Projects for the dropdown
    const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true })

    if (inventoryError || projectsError) {
        return <div className="p-4 text-red-500">Erro ao carregar dados.</div>
    }

    return (
        <div className="max-w-[1600px] mx-auto py-10 space-y-8">
            <div>
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Almoxarifado</h1>
                <p className="text-lg text-slate-500 font-medium mt-2">
                    Controle de estoque, insumos e ferramentas por Obra.
                </p>
            </div>

            <InventoryList
                items={(inventoryData as any[]) || []}
                projects={(projectsData as Project[]) || []}
            />
        </div>
    )
}
