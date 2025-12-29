import { createClient } from "@/lib/supabase/server"
import { ProjectList } from "@/components/projects/ProjectList"
import { Project } from "@/lib/schemas-project"

export default async function ProjectsPage() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        // Should be handled by layout/middleware but good to be safe
        return <div>Acesso negado.</div>
    }

    const { data: projects, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">Projetos & Obras</h1>
                    <p className="text-lg text-slate-500 mt-2 font-medium">Gerencie o andamento e status de todas as suas obras.</p>
                </div>
            </div>

            {/* Error Display (Styled if needed, but keeping console log mostly) */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600">
                    <p className="font-bold">Erro ao carregar dados:</p>
                    <pre className="text-xs mt-2">{JSON.stringify(error, null, 2)}</pre>
                </div>
            )}

            <ProjectList projects={(projects as Project[]) || []} />
        </div>
    )
}
