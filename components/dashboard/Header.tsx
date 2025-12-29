"use client"

import React from "react"
import { createClient } from "@/lib/supabase/client"
import { LogOut, User, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MobileSidebar } from "@/components/dashboard/MobileSidebar"
import { InstallPWA } from "@/components/pwa/InstallPWA"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface HeaderProps {
    userEmail?: string | null
}

export function Header({ userEmail }: HeaderProps) {
    const router = useRouter()
    const supabase = createClient()
    const [profile, setProfile] = useState<any>(null)

    useEffect(() => {
        async function fetchProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()
                if (data) setProfile(data)
            }
        }
        fetchProfile()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/login")
    }

    const displayName = profile?.full_name || "Engenheiro Sênior"
    const displayAvatar = profile?.avatar_url



    return (
        <header className="h-28 bg-white border-b border-slate-200 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-40 shadow-sm">
            {/* Left side (Breadcrumbs or Page Title could go here) */}
            <div className="flex items-center gap-4">
                <InstallPWA />
                <MobileSidebar />
                {/* Placeholder for future page title integration */}
            </div>

            {/* Right side: User & Actions */}
            <div className="flex items-center gap-8">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-12 w-12 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 relative">
                            <Bell className="h-7 w-7" />
                            <span className="absolute top-3 right-3 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <h4 className="font-bold text-slate-800">Notificações</h4>
                            <p className="text-xs text-slate-500">Gerencie seus alertas em configurações.</p>
                        </div>
                        <div className="p-4 text-center text-sm text-slate-400 py-8">
                            Nenhuma notificação nova.
                        </div>
                        <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                            <Button variant="ghost" className="w-full text-xs h-8 text-blue-600" onClick={() => router.push('/dashboard/settings?tab=notifications')}>
                                Configurar notificações
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="h-10 w-px bg-slate-200" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-5 pl-3 pr-6 py-8 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 h-auto transition-all">
                            <Avatar className="h-14 w-14 border-[3px] border-white shadow-md">
                                <AvatarImage src={displayAvatar || "/avatars/01.png"} alt={displayName} />
                                <AvatarFallback className="bg-blue-100 text-blue-700 font-extrabold text-xl">
                                    {displayName[0]?.toUpperCase() || <User className="h-7 w-7" />}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex flex-col items-start gap-1">
                                <span className="font-extrabold text-slate-800 text-lg leading-none">{displayName}</span>
                                <span className="text-base text-slate-500 font-medium">{userEmail || "Usuário"}</span>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuLabel className="text-base">Minha Conta</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="py-3 text-base cursor-pointer" onClick={() => router.push("/dashboard/settings?tab=profile")}>
                            Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem className="py-3 text-base cursor-pointer" onClick={() => router.push("/dashboard/settings")}>
                            Configurações
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 py-3 text-base font-medium cursor-pointer">
                            <LogOut className="mr-3 h-5 w-5" />
                            Sair do Sistema
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
