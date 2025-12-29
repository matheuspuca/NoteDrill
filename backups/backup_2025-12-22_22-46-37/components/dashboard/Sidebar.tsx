"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
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
    Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

import { DrillIcon } from "@/components/icons/DrillIcon"

const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Projetos/Obra", icon: HardHat, href: "/dashboard/projects" },
    { label: "Apontamento/BDP", icon: ClipboardList, href: "/dashboard/bdp" },
    { label: "Equipamentos", icon: DrillIcon, href: "/dashboard/equipments" },
    { label: "Almoxarifado", icon: Package, href: "/dashboard/inventory" },
    { label: "Equipe", icon: Users, href: "/dashboard/team" },
    { label: "Configurações", icon: Settings, href: "/dashboard/settings" },
]

export function Sidebar() {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const pathname = usePathname()

    // Persist collapsed state
    useEffect(() => {
        const saved = localStorage.getItem("sidebarCollapsed")
        if (saved) setIsCollapsed(JSON.parse(saved))
    }, [])

    const toggleCollapse = () => {
        const newState = !isCollapsed
        setIsCollapsed(newState)
        localStorage.setItem("sidebarCollapsed", JSON.stringify(newState))
    }

    return (
        <aside
            className={cn(
                "bg-white border-r border-slate-200 h-screen fixed left-0 top-0 transition-all duration-300 z-50 flex flex-col shadow-sm",
                isCollapsed ? "w-24" : "w-80" // Increased width
            )}
        >
            {/* Header / Logo */}
            <div className="h-28 flex items-center justify-between px-8 border-b border-slate-100">
                <div className={cn("flex items-center gap-4 overflow-hidden transition-all", isCollapsed && "justify-center w-full px-0")}>
                    <div className="bg-blue-600 p-3.5 rounded-2xl flex-shrink-0 shadow-lg shadow-blue-600/20">
                        <Zap className="h-8 w-8 text-white fill-white" />
                    </div>

                    {!isCollapsed && (
                        <span className="font-extrabold text-3xl text-slate-800 tracking-tight whitespace-nowrap">
                            SmartDrill
                        </span>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 px-5 py-4 rounded-xl transition-all group",
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

            {/* Footer / Toggle */}
            <div className="p-6 border-t border-slate-100">
                <button
                    onClick={toggleCollapse}
                    className="w-full flex items-center justify-center p-3 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
                >
                    {isCollapsed ? <ChevronRight className="h-6 w-6" /> : (
                        <div className="flex items-center gap-3 text-base font-semibold">
                            <ChevronLeft className="h-6 w-6" />
                            <span>Recolher Menu</span>
                        </div>
                    )}
                </button>
            </div>
        </aside>
    )
}
