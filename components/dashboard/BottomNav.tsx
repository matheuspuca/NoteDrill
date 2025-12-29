"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, HardHat, ClipboardList, User } from "lucide-react"
import { cn } from "@/lib/utils"

export function BottomNav() {
    const pathname = usePathname()

    const navItems = [
        { label: "Home", icon: LayoutDashboard, href: "/dashboard" },
        { label: "BDP", icon: ClipboardList, href: "/dashboard/bdp" },
        { label: "Obras", icon: HardHat, href: "/dashboard/projects" },
        { label: "Perfil", icon: User, href: "/dashboard/settings" },
    ]

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-slate-200 lg:hidden safe-area-bottom">
            <nav className="flex items-center justify-around h-20 px-2 pb-safe">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

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
