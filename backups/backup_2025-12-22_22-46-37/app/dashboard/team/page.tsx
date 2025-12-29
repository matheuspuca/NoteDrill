import { createClient } from "@/lib/supabase/server"
import { TeamList } from "@/components/team/TeamList"
import { TeamMember } from "@/lib/schemas-team"

export default async function TeamPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Acesso negado.</div>

    const { data: teamData, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("user_id", user.id)
        .order("name", { ascending: true })

    if (error) {
        return <div className="p-4 text-red-500">Erro ao carregar equipe.</div>
    }

    return (
        <div className="max-w-[1600px] mx-auto py-10 space-y-8">
            <div>
                <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Equipe</h1>
                <p className="text-lg text-slate-500 font-medium mt-2">
                    Gerencie os membros da sua equipe e permissões.
                </p>
            </div>

            <TeamList members={(teamData as TeamMember[]) || []} />
        </div>
    )
}
