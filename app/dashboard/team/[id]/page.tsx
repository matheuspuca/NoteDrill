import { createClient } from "@/lib/supabase/server"
import { TeamForm } from "@/components/team/TeamForm"
import { TeamMember } from "@/lib/schemas-team"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

interface PageProps {
    params: {
        id: string
    }
}

export default async function EditTeamMemberPage({ params }: PageProps) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return redirect("/login")

    // Fetch Member
    const { data: member } = await supabase
        .from("team_members")
        .select("*")
        .eq("id", params.id)
        .single()

    // Fetch Available EPIs
    const { data: epis } = await supabase
        .from("inventory_epis")
        .select("*")
        .eq("user_id", user.id)
        .order("name")

    // Fetch EPI History
    const { data: epiHistory } = await supabase
        .from("epi_usage")
        .select(`
            id, date, quantity,
            inventory_epis ( name, ca, unit )
        `)
        .eq("teamMemberId", params.id)
        .order("date", { ascending: false })

    // Fetch Company Settings
    const { data: companySettings, error: companyError } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", user.id)
        .single()

    if (companyError) {
        console.error("DEBUG SERVER PAGE: Company Settings Error:", companyError)
    } else {
        console.log("DEBUG SERVER PAGE: Company Settings Found:", companySettings?.company_name)
    }

    // Fetch Projects
    const { data: projects } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name")

    if (!member) return <div>Membro não encontrado.</div>

    return (
        <div className="max-w-4xl mx-auto py-10">
            <h1 className="text-3xl font-black text-slate-900 mb-8">Editar Membro</h1>
            <div className="bg-white p-8 rounded-2xl shadow-xl ring-1 ring-slate-100">
                <TeamForm
                    member={member as TeamMember}
                    epis={epis || []}
                    epiHistory={epiHistory || []}
                    companySettings={companySettings}
                    projects={projects || []}
                />
            </div>
        </div>
    )
}
