import { Sidebar } from "@/components/dashboard/Sidebar"
import { Header } from "@/components/dashboard/Header"
import { DashboardShell } from "@/components/dashboard/DashboardShell"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getUserSubscription } from "@/lib/subscription-utils"
import { hasAccess } from "@/utils/access-control"

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

    // New Access Control Logic
    const subscription = await getUserSubscription(user.id)
    const accessResult = hasAccess(user, subscription)

    if (!accessResult.allowed) {
        // Hard Wall Redirect
        redirect("/pricing?reason=trial_expired")
    }

    return (
        <div className="flex min-h-screen w-full bg-slate-50 overflow-x-hidden">
            <Sidebar userEmail={user.email} />
            <div className="flex-1 flex flex-col pl-0 transition-all duration-300 lg:pl-0">
                <DashboardShell userEmail={user.email}>
                    {accessResult.reason === 'trial_active' && accessResult.trialDaysRemaining !== undefined && (
                        <div className="w-full bg-blue-600 text-white text-center text-sm py-1 font-medium">
                            Você tem {accessResult.trialDaysRemaining} dias restantes no seu teste grátis.
                            <a href="/pricing" className="ml-2 underline hover:text-blue-100">Assine agora</a>
                        </div>
                    )}
                    {children}
                </DashboardShell>
            </div>
        </div>
    )
}
