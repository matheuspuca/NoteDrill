"use client"

import React from "react"
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
    Menu,
    Zap
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
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

export function MobileSidebar() {
    const pathname = usePathname()
    const [open, setOpen] = React.useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-slate-500 hover:bg-slate-100">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Abrir menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 bg-white border-r-slate-200">
                <SheetHeader className="h-28 flex items-center justify-start px-8 border-b border-slate-100 mb-4">
                    <div className="flex items-center gap-4 w-full">
                        <div className="relative h-14 w-14 flex-shrink-0">
                            <Image src="/logo-dashboard.png" alt="NoteDrill" fill className="object-contain" />
                        </div>
                        <SheetTitle className="font-extrabold text-2xl text-slate-800 tracking-tight">
                            NoteDrill
                        </SheetTitle>
                    </div>
                </SheetHeader>

                <nav className="flex-1 py-4 px-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setOpen(false)}
                                className={cn(
                                    "flex items-center gap-4 px-5 py-4 rounded-xl transition-all group",
                                    isActive
                                        ? "bg-blue-50 text-blue-700 font-bold shadow-sm border border-blue-100"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium"
                                )}
                            >
                                <item.icon className={cn("h-6 w-6 flex-shrink-0", isActive ? "text-blue-700" : "text-slate-400 group-hover:text-slate-600")} />
                                <span className="text-lg">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>
            </SheetContent>
        </Sheet>
    )
}
