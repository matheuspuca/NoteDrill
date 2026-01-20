

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, User, Bell, Shield, Database } from "lucide-react"
import { CompanySettingsForm } from "@/components/settings/CompanySettingsForm"
import { ProfileSettingsForm } from "@/components/settings/ProfileSettingsForm"
import { NotificationSettings } from "@/components/settings/NotificationSettings"
import { SecuritySettingsForm } from "@/components/settings/SecuritySettingsForm"
import { BackupSettings } from "@/components/settings/BackupSettings"

import { createClient } from "@/lib/supabase/server"

export default async function SettingsPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let companySettings = null
    let profile = null
    let userEmail = ""

    if (user) {
        userEmail = user.email || ""

        // Fetch Company Settings
        const { data: companyData } = await supabase
            .from("company_settings")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle()
        companySettings = companyData

        // Fetch Profile
        const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle()
        profile = profileData
    }
    return (
        <div className="container mx-auto py-10 space-y-8 max-w-5xl">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-black text-slate-800 tracking-tight">Configurações</h1>
                <p className="text-slate-500 text-xl">Gerencie os dados da sua empresa, perfil e preferências.</p>
            </div>

            <Tabs defaultValue="company" className="w-full space-y-6">
                <TabsList className="bg-slate-100 p-1 rounded-xl h-auto flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto">
                    <TabsTrigger
                        value="company"
                        className="w-full sm:w-auto rounded-lg h-12 md:h-14 px-4 md:px-6 text-base md:text-lg font-bold data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all flex gap-2 items-center justify-center sm:justify-start"
                    >
                        <Building2 className="w-4 h-4" /> Empresa
                    </TabsTrigger>
                    <TabsTrigger
                        value="profile"
                        className="w-full sm:w-auto rounded-lg h-12 md:h-14 px-4 md:px-6 text-base md:text-lg font-bold data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all flex gap-2 items-center justify-center sm:justify-start"
                    >
                        <User className="w-4 h-4" /> Meu Perfil
                    </TabsTrigger>
                    <TabsTrigger
                        value="security"
                        className="w-full sm:w-auto rounded-lg h-12 md:h-14 px-4 md:px-6 text-base md:text-lg font-bold data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all flex gap-2 items-center justify-center sm:justify-start"
                    >
                        <Shield className="w-4 h-4" /> Segurança
                    </TabsTrigger>
                    <TabsTrigger
                        value="backups"
                        className="w-full sm:w-auto rounded-lg h-12 md:h-14 px-4 md:px-6 text-base md:text-lg font-bold data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all flex gap-2 items-center justify-center sm:justify-start"
                    >
                        <Database className="w-4 h-4" /> Backups
                    </TabsTrigger>
                    <TabsTrigger
                        value="notifications"
                        className="w-full sm:w-auto rounded-lg h-12 md:h-14 px-4 md:px-6 text-base md:text-lg font-bold data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm transition-all flex gap-2 items-center justify-center sm:justify-start"
                    >
                        <Bell className="w-4 h-4" /> Notificações
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="company" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CompanySettingsForm initialData={companySettings} />
                </TabsContent>

                <TabsContent value="profile" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ProfileSettingsForm initialData={{ ...profile, user_email: userEmail }} />
                </TabsContent>

                <TabsContent value="security" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <SecuritySettingsForm />
                </TabsContent>

                <TabsContent value="backups" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <BackupSettings />
                </TabsContent>

                <TabsContent value="notifications" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <NotificationSettings />
                </TabsContent>
            </Tabs>
        </div>
    )
}
