import { createClient } from "@/lib/supabase/server"
import { TeamForm } from "@/components/team/TeamForm"
import { redirect } from "next/navigation"

export default async function NewTeamMemberPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return redirect("/login")

    return (
        <div className="max-w-4xl mx-auto py-10">
            <h1 className="text-3xl font-black text-slate-900 mb-8">Novo Membro da Equipe</h1>
            <div className="bg-white p-8 rounded-2xl shadow-xl ring-1 ring-slate-100">
                <TeamForm />
            </div>
        </div>
    )
}
