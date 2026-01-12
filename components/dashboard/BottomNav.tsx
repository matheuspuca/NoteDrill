"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { LayoutDashboard, HardHat, ClipboardList, User, Menu, Package, Users, Settings, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { DrillIcon } from "@/components/icons/DrillIcon"

export function BottomNav() {
    const pathname = usePathname()

    const navItems = [
        { label: "Home", icon: LayoutDashboard, href: "/dashboard" },
        { label: "BDP", icon: ClipboardList, href: "/dashboard/bdp" },
        { label: "Obras", icon: HardHat, href: "/dashboard/projects" },
        // { label: "Perfil", icon: User, href: "/dashboard/settings" }, // Moved to generic Menu or kept? Let's keep specific profile access for convenience, or replace with Menu?
        // User asked for "full menu". A "Menu" button is best.
        { label: "Menu", icon: Menu, isMenu: true },
    ]

    const fullMenuItems = [
        { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
        { label: "Projetos/Obra", icon: HardHat, href: "/dashboard/projects" },
        { label: "Apontamento/BDP", icon: ClipboardList, href: "/dashboard/bdp" },
        { label: "Equipamentos", icon: DrillIcon, href: "/dashboard/equipments" },
        { label: "Almoxarifado", icon: Package, href: "/dashboard/inventory" },
        { label: "Equipe", icon: Users, href: "/dashboard/team" },
        { label: "Configurações", icon: Settings, href: "/dashboard/settings" },
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-slate-200 lg:hidden safe-area-bottom">
            <nav className="flex items-center justify-around h-20 px-2 pb-safe">
                {navItems.map((item: any) => {
                    const isActive = item.href ? (pathname === item.href || pathname.startsWith(item.href + "/")) : false

                    if (item.isMenu) {
                        return (
                            <Sheet key="mobile-menu">
                                <SheetTrigger asChild>
                                    <button
                                        className={cn(
                                            "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        <div className="p-1 rounded-xl transition-all">
                                            <item.icon className="h-6 w-6" />
                                        </div>
                                        <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
                                    </button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-80 p-0 bg-white border-r-slate-200 z-[60]">
                                    <SheetHeader className="h-28 flex items-center justify-start px-8 border-b border-slate-100 mb-4">
                                        <div className="flex items-center gap-4 w-full">
                                            <div className="relative h-10 w-10 flex-shrink-0">
                                                <Image src="/logo-dashboard.png" alt="NoteDrill" fill className="object-contain" />
                                            </div>
                                            <SheetTitle className="font-extrabold text-2xl text-slate-800 tracking-tight">
                                                NoteDrill
                                            </SheetTitle>
                                        </div>
                                    </SheetHeader>

                                    <nav className="flex-1 py-4 px-4 space-y-2 overflow-y-auto">
                                        {fullMenuItems.map((menuItem) => {
                                            const isMenuActive = pathname === menuItem.href
                                            return (
                                                <Link
                                                    key={menuItem.href}
                                                    href={menuItem.href}
                                                    className={cn(
                                                        "flex items-center gap-4 px-5 py-4 rounded-xl transition-all group",
                                                        isMenuActive
                                                            ? "bg-blue-50 text-blue-700 font-bold shadow-sm border border-blue-100"
                                                            : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium"
                                                    )}
                                                >
                                                    <menuItem.icon className={cn("h-6 w-6 flex-shrink-0", isMenuActive ? "text-blue-700" : "text-slate-400 group-hover:text-slate-600")} />
                                                    <span className="text-lg">{menuItem.label}</span>
                                                </Link>
                                            )
                                        })}
                                    </nav>
                                </SheetContent>
                            </Sheet>
                        )
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                                isActive
                                    ? "text-blue-600"
                                    : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <div className={cn(
                                "p-1 rounded-xl transition-all",
                                isActive && "bg-blue-50"
                            )}>
                                <item.icon className={cn("h-6 w-6", isActive && "fill-current")} />
                            </div>
                            <span className="text-[10px] font-bold tracking-wide">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </div>
    )
}
