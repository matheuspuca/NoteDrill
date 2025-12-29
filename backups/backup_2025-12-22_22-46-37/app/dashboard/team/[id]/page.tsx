import { createClient } from "@/lib/supabase/server"
import { TeamForm } from "@/components/team/TeamForm"
import { TeamMember } from "@/lib/schemas-team"
import { redirect } from "next/navigation"

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

    if (!member) return <div>Membro não encontrado.</div>

    return (
        <div className="max-w-4xl mx-auto py-10">
            <h1 className="text-3xl font-black text-slate-900 mb-8">Editar Membro</h1>
            <div className="bg-white p-8 rounded-2xl shadow-xl ring-1 ring-slate-100">
                <TeamForm member={member as TeamMember} />
            </div>
        </div>
    )
}
