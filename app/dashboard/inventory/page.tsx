import { createClient } from "@/lib/supabase/server"
import { InventoryList } from "@/components/inventory/InventoryList"
import { InventoryItem } from "@/lib/schemas-inventory"
import { Project } from "@/lib/schemas-project"

export default async function InventoryPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Acesso negado.</div>

    // Fetch Inventory data (Standard Items)
    const { data: inventoryData, error: inventoryError } = await supabase
        .from("inventory_items")
        .select(`*, projects (name)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    // Fetch EPIs
    const { data: epiData, error: epiError } = await supabase
        .from("inventory_epis")
        .select(`*, projects (name)`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    // Fetch Projects for the dropdown
    const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true })

    // Fetch Company Settings for Reports
    const { data: companySettings } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", user.id)
        .single()

    if (inventoryError || projectsError || epiError) {
        return <div className="p-4 text-red-500">Erro ao carregar dados.</div>
    }

    // Merge Data
    const formattedItems = (inventoryData || []).map(i => ({ ...i, type: "Material" }))
    const formattedEpis = (epiData || []).map(i => ({ ...i, type: "EPI", brand: i.ca ? `CA: ${i.ca}` : "" }))

    // Combine and sort by date
    const allItems = [...formattedItems, ...formattedEpis].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    return (
        <div className="max-w-[1600px] mx-auto py-6 px-4 lg:px-8 space-y-8">
            <div>
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Almoxarifado</h1>
                <p className="text-lg text-slate-500 font-medium mt-2">
                    Controle de estoque, insumos e ferramentas por Obra.
                </p>
            </div>

            <InventoryList
                items={(allItems as any[]) || []}
                projects={(projectsData as Project[]) || []}
                companySettings={companySettings}
            />
        </div>
    )
}
