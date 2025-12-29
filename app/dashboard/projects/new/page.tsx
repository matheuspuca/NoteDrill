import { ProjectForm } from "@/components/projects/ProjectForm"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function NewProjectPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    return (
        <div className="max-w-[1200px] mx-auto py-10 px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Nova Obra</h1>
                <p className="text-lg text-slate-500 mt-2">Preencha os dados abaixo para cadastrar um novo projeto.</p>
            </div>

            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
                <ProjectForm />
            </div>
        </div>
    )
}
