"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, HardHat, TrendingUp, AlertCircle } from "lucide-react"

export function BDPKPIs() {
    // In a real app, we would fetch these stats
    const kpis = [
        { label: "Total Perfurado (Mês)", value: "1,240m", icon: HardHat, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Disponibilidade Física", value: "92%", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
        { label: "Média (m/h)", value: "18.5", icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50" },
        { label: "Equipe Ativa", value: "12", icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {kpis.map((kpi, index) => (
                <Card key={index} className="border-none shadow-lg bg-white rounded-2xl ring-1 ring-slate-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                            {kpi.label}
                        </CardTitle>
                        <div className={`p-2 rounded-xl ${kpi.bg}`}>
                            <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-800">{kpi.value}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
