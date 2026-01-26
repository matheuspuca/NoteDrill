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
    const { data: projects } = await supabase.from("projects").select("id, name").eq("user_id", user.id).order("name")

    // Fetch Team Members (Try to find linked operator)
    const { data: teamMembers } = await supabase.from("team_members").select("*").eq("user_id", user.id).eq("status", "Ativo").order("name")

    // Find cached/linked operator
    const linkedMember = teamMembers?.find((m: any) => m.linked_user_id === user.id)

    // Fetch Equipments (Try to find linked equipment by project if exists)
    const { data: equipments } = await supabase.from("equipment").select("*").eq("user_id", user.id).eq("status", "Operacional").order("name")

    // Fetch Inventory
    const { data: inventoryItems } = await supabase.from("inventory_items").select("id, name, unit").eq("user_id", user.id).order("name")

    // Determine Defaults
    let defaultOperatorId = linkedMember?.id
    let defaultProjectId = (linkedMember as any)?.project_id

    // Fallback: If only one project, select it
    if (!defaultProjectId && projects && projects.length === 1) {
        defaultProjectId = projects[0].id
    }

    // Try to find drill for the project
    let defaultDrillId = ""
    if (defaultProjectId && equipments) {
        // Check if equipment has project_id and matches
        const projectDrill = equipments.find((e: any) => e.project_id === defaultProjectId)
        if (projectDrill) {
            defaultDrillId = projectDrill.id
        }
    }

    // Fetch Open Plans
    const { data: planos } = await supabase
        .from("plano_de_fogo")
        .select("id, name, project_id, status")
        .eq("user_id", user.id)
        .eq("status", "Aberto")

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
                planos={planos || []}
                defaultValues={{
                    operatorId: defaultOperatorId,
                    projectId: defaultProjectId,
                    drillId: defaultDrillId
                }}
            />
        </div>
    )
}
