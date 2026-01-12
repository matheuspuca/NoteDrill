"use client"

import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

import { BottomNav } from "@/components/dashboard/BottomNav"


interface DashboardShellProps {
    children: React.ReactNode
    userEmail: string | undefined
}

export function DashboardShell({ children, userEmail }: DashboardShellProps) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

    useEffect(() => {
        // Check local storage to sync margin with sidebar state
        const checkState = () => {
            const saved = localStorage.getItem("sidebarCollapsed")
            if (saved) setIsSidebarCollapsed(JSON.parse(saved))
        }

        // Initial check
        checkState()

        const interval = setInterval(() => {
            const saved = localStorage.getItem("sidebarCollapsed")
            const parsed = saved ? JSON.parse(saved) : false
            if (parsed !== isSidebarCollapsed) {
                setIsSidebarCollapsed(parsed)
            }
        }, 100)

        return () => clearInterval(interval)
    }, [isSidebarCollapsed])



    return (
        <div
            className={cn(
                "flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out",
                isSidebarCollapsed ? "lg:pl-24" : "lg:pl-80" // Desktop padding
            )}
        >
            <main className="flex-1 p-4 lg:p-10 bg-slate-50 overflow-x-hidden pb-24 lg:pb-10 pt-8 lg:pt-10"> {/* Added top padding since header is gone */}
                {children}
            </main>
            <BottomNav />
        </div>
    )
}
