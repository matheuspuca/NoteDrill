import { createClient } from "@/lib/supabase/server"
import { BDPForm } from "@/components/bdp/BDPForm"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function EditBDPPage({ params }: { params: { id: string } }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div>Acesso negado.</div>
    }

    const id = params.id

    // Fetch BDP Data
    const { data: bdp, error } = await supabase
        .from("bdp_reports")
        .select("*")
        .eq("id", id)
        .single()

    if (error || !bdp) {
        return <div>Relatório não encontrado.</div>
    }

    // Map to Schema
    const initialData = {
        id: bdp.id,
        reportNumber: bdp.report_number,
        date: bdp.date,
        shift: bdp.shift,
        status: bdp.status,
        projectId: bdp.project_id,
        operatorId: bdp.operator_id,
        drillId: bdp.drill_id,
        helperId: bdp.helper_id || undefined,
        compressorId: bdp.compressor_id || undefined,

        hourmeterStart: bdp.hourmeter_start || 0,
        hourmeterEnd: bdp.hourmeter_end || 0,
        startTime: bdp.start_time || undefined,
        endTime: bdp.end_time || undefined,

        materialDescription: bdp.material_description || "",
        rockStatus: bdp.rock_status || undefined,
        rockStatusReason: bdp.rock_status_reason || "",

        // Json Arrays
        services: bdp.services || [],
        occurrences: bdp.occurrences || [],
        supplies: bdp.supplies || [],
        holes: bdp.holes || [],

        lithologyProfile: bdp.lithology_profile || undefined,
    }

    // Fetch Lists
    const { data: projects } = await supabase.from("projects").select("id, name").eq("user_id", user.id).order("name")
    const { data: teamMembers } = await supabase.from("team_members").select("id, name, role, registrationNumber").eq("user_id", user.id).eq("status", "Ativo").order("name")
    const { data: equipments } = await supabase.from("equipment").select("id, name, type").eq("user_id", user.id).eq("status", "Operacional").order("name")
    const { data: inventoryItems } = await supabase.from("inventory_items").select("id, name, unit").eq("user_id", user.id).order("name")

    return (
        <div className="max-w-[1200px] mx-auto pb-20 pt-6">
            <div className="mb-10 flex items-center gap-4">
                <Link href="/dashboard/bdp">
                    <button className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors">
                        <ChevronLeft className="w-6 h-6 text-slate-500" />
                    </button>
                </Link>
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        Editar BDP <span className="text-slate-400 font-mono text-2xl">#{bdp.report_number}</span>
                    </h1>
                    <p className="text-lg text-slate-500 mt-2 font-medium">Atualize as informações do boletim.</p>
                </div>
            </div>

            <BDPForm
                projects={projects || []}
                teamMembers={teamMembers || []}
                equipments={equipments || []}
                inventoryItems={inventoryItems || []}
                initialData={initialData}
            />
        </div>
    )
}
