import { createClient } from "@/lib/supabase/server"
import { PlanoList } from "@/components/plano/PlanoList"
import { getPlanosByProject } from "./plano-actions"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Plano de Fogo | NoteDrill",
    description: "Gerenciamento de Planos de Fogo e furação.",
}

export default async function PlanoDeFogoPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div>Acesso negado.</div>
    }

    // Fetch projects for the creation dialog
    const { data: projects } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name")

    // Fetch initial planos
    const result = await getPlanosByProject()
    const planos = result.data || []

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-10 px-4 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Plano de Fogo</h1>
                    <p className="text-lg text-slate-500 mt-2 font-medium">Gestão de planos de furação e detonação.</p>
                </div>
            </div>

            <PlanoList
                initialPlanos={planos}
                projects={projects || []}
            />
        </div>
    )
}
