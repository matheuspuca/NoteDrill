import { Sidebar } from "@/components/dashboard/Sidebar"
import { Header } from "@/components/dashboard/Header"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    return (
        <div className="flex h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 flex flex-col pl-20 transition-all duration-300 lg:pl-0">
                {/* pl-20 is for when sidebar is collapsed (mobile default or collapsed) 
            We will rely on Sidebar's internal padding/margin logic or a context 
            if we want perfect sync, but for now CSS margin on main content 
            controlled by sidebar width state would be better handled by 
            a Context. For simplicity in this step, I'm setting a base padding 
            assuming sidebar presence. Better approach: Wrapper component.
        */}
                {/* Correction: The sidebar is fixed. We need to push the content. 
            Since Sidebar state is client-side, we might have a layout shift or need a client wrapper.
            To avoid complexity, we can use a Client Component wrapper for the layout body 
            or just use a margin that matches the expanded/collapsed state. 
            Let's structure it so Sidebar and Content are side-by-side flex if possible, 
            OR keep fixed sidebar and use 'ml-72' style classes. 
            
            Given user requirement "Recolhimento", let's make a DashboardShell 
            client component to handle the margin transition.
        */}
                <DashboardShell userEmail={user.email}>
                    {children}
                </DashboardShell>
            </div>
        </div>
    )
}

import { DashboardShell } from "@/components/dashboard/DashboardShell"
