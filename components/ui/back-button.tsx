"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function BackButton() {
    const router = useRouter()

    return (
        <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 pl-0 hover:bg-transparent hover:text-blue-600 transition-colors flex items-center gap-3 group text-slate-400"
        >
            <div className="p-2.5 rounded-xl bg-white group-hover:bg-blue-50 border border-slate-200 group-hover:border-blue-200 transition-all shadow-sm">
                <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-bold text-sm uppercase tracking-widest opacity-80 group-hover:opacity-100">Voltar</span>
        </Button>
    )
}
