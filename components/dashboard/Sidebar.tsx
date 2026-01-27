"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    HardHat,
    ClipboardList,
    Package,
    Users,
    Settings,
    ChevronLeft,
    ChevronRight,
    Zap,
    LogOut,
    User,
    Flame
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

import { DrillIcon } from "@/components/icons/DrillIcon"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { InstallPWA } from "@/components/pwa/InstallPWA"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Plano de Fogo", icon: Flame, href: "/dashboard/plano-de-fogo" },
    { label: "Projetos/Obra", icon: HardHat, href: "/dashboard/projects" },
    { label: "Equipamentos", icon: DrillIcon, href: "/dashboard/equipments" },
    { label: "Almoxarifado", icon: Package, href: "/dashboard/inventory" },
    { label: "Equipe", icon: Users, href: "/dashboard/team" },
]

export function Sidebar({ userEmail }: { userEmail?: string }) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [profile, setProfile] = useState<any>(null)
    const [user, setUser] = useState<any>(null)

    // Persist collapsed state
    useEffect(() => {
        const saved = localStorage.getItem("sidebarCollapsed")
        if (saved) setIsCollapsed(JSON.parse(saved))
    }, [])

    useEffect(() => {
        async function fetchProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
            if (user) {
                const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()
                if (data) {
                    setProfile(data)
                }
            }
        }
        fetchProfile()
    }, [])

    const toggleCollapse = () => {
        const newState = !isCollapsed
        setIsCollapsed(newState)
        localStorage.setItem("sidebarCollapsed", JSON.stringify(newState))
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/login")
    }

    // Fallback to auth metadata if profile table is empty
    const displayName = profile?.full_name || user?.user_metadata?.full_name || "Engenheiro"
    const displayAvatar = profile?.avatar_url || user?.user_metadata?.avatar_url

    return (
        <aside
            className={cn(
                "bg-white border-r border-slate-200 h-screen fixed left-0 top-0 transition-all duration-300 z-50 flex flex-col shadow-sm hidden lg:flex", // Ensure flex-col
                isCollapsed ? "w-24" : "w-80"
            )}
        >
            {/* Header / Logo */}
            <div className={cn(
                "h-24 flex items-center border-b border-slate-100 flex-shrink-0 transition-all",
                isCollapsed ? "justify-center px-2" : "justify-between px-8"
            )}>
                <div className={cn("flex items-center gap-4 overflow-hidden transition-all", isCollapsed && "hidden")}>
                    <div className="relative h-14 w-14 flex-shrink-0">
                        <Image src="/logo-dashboard.png" alt="NoteDrill" fill className="object-contain" />
                    </div>

                    <span className="font-extrabold text-3xl text-slate-800 tracking-tight whitespace-nowrap">
                        NoteDrill
                    </span>
                </div>

                <button
                    onClick={toggleCollapse}
                    className="p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
                >
                    {isCollapsed ? <ChevronRight className="h-6 w-6" /> : <ChevronLeft className="h-6 w-6" />}
                </button>

            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-4 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 px-5 py-3 rounded-xl transition-all group",
                                isActive
                                    ? "bg-blue-50 text-blue-700 font-bold shadow-sm border border-blue-100"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium",
                                isCollapsed && "justify-center px-2"
                            )}
                        >
                            <item.icon className={cn("h-7 w-7 flex-shrink-0", isActive ? "text-blue-700" : "text-slate-400 group-hover:text-slate-600")} />

                            {!isCollapsed && (
                                <span className="truncate text-lg">{item.label}</span>
                            )}

                            {isCollapsed && isActive && (
                                <div className="absolute right-0 w-1.5 h-10 bg-blue-600 rounded-l-full" />
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer: User & System Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex flex-col gap-4 flex-shrink-0">

                {/* 1. Install PWA Button (Only if not collapsed) */}
                {!isCollapsed && (
                    <div className="w-full">
                        <InstallPWA />
                    </div>
                )}

                {/* 2. User Profile Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={cn(
                            "flex items-center gap-3 p-3 rounded-2xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all text-left w-full",
                            isCollapsed && "justify-center p-2"
                        )}>
                            <Avatar className="h-10 w-10 border-2 border-white shadow-sm flex-shrink-0 bg-slate-100 flex items-center justify-center">
                                <AvatarImage src={displayAvatar || ""} alt={displayName} />
                                <AvatarFallback className="bg-blue-100 text-blue-700 font-bold flex items-center justify-center w-full h-full">
                                    {displayName === "Engenheiro" ? <User className="h-5 w-5" /> : displayName[0]?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            {!isCollapsed && (
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-bold text-slate-800 text-sm truncate">{displayName}</p>
                                    <p className="text-xs text-slate-500 truncate">{userEmail || "Usuário"}</p>
                                </div>
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isCollapsed ? "center" : "end"} side={isCollapsed ? "right" : "top"} className="w-64 mb-2">
                        <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => router.push("/dashboard/settings?tab=profile")} className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" /> Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push("/dashboard/settings")} className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" /> Configurações
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" /> Sair
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* 3. Collapse Toggle */}

            </div>
        </aside >
    )
}
