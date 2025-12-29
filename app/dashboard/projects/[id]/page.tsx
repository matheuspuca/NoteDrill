import { ProjectForm } from "@/components/projects/ProjectForm"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function EditProjectPage({ params }: { params: { id: string } }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const { data: project, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", params.id)
        .eq("user_id", user.id)
        .single()

    if (error || !project) {
        redirect("/dashboard/projects")
    }

    return (
        <div className="max-w-[1200px] mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Editar Obra</h1>
                <p className="text-lg text-slate-500 mt-2">Atualize as informações do projeto abaixo.</p>
            </div>

            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                <ProjectForm project={project} />
            </div>
        </div>
    )
}
