"use client"

import React from "react"
import { createClient } from "@/lib/supabase/client"
import { LogOut, User, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

interface HeaderProps {
    userEmail?: string | null
}

export function Header({ userEmail }: HeaderProps) {
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/login")
    }

    return (
        <header className="h-28 bg-white border-b border-slate-200 px-10 flex items-center justify-between sticky top-0 z-40 shadow-sm">
            {/* Left side (Breadcrumbs or Page Title could go here) */}
            <div className="flex items-center gap-4">
                {/* Placeholder for future page title integration */}
            </div>

            {/* Right side: User & Actions */}
            <div className="flex items-center gap-8">
                <Button variant="ghost" size="icon" className="h-12 w-12 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                    <Bell className="h-7 w-7" />
                </Button>

                <div className="h-10 w-px bg-slate-200" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-5 pl-3 pr-6 py-8 hover:bg-slate-50 rounded-2xl border border-transparent hover:border-slate-100 h-auto transition-all">
                            <div className="h-14 w-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-extrabold border-[3px] border-white shadow-md text-xl">
                                {userEmail ? userEmail[0].toUpperCase() : <User className="h-7 w-7" />}
                            </div>
                            <div className="flex flex-col items-start gap-1">
                                <span className="font-extrabold text-slate-800 text-lg leading-none">Engenheiro Sênior</span>
                                <span className="text-base text-slate-500 font-medium">{userEmail || "Usuário"}</span>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuLabel className="text-base">Minha Conta</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="py-3 text-base">Perfil</DropdownMenuItem>
                        <DropdownMenuItem className="py-3 text-base">Configurações</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 py-3 text-base font-medium">
                            <LogOut className="mr-3 h-5 w-5" />
                            Sair do Sistema
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
