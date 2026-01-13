"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck, Wrench, Activity, Zap, BarChart3, PieChart, Timer, AlertOctagon } from "lucide-react"
import { differenceInMinutes, parse } from "date-fns"
import { Equipment } from "@/lib/schemas-equipment"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RePieChart,
    Pie,
    Cell,
} from "recharts"

interface EquipmentKPIsProps {
    equipments: Equipment[]
    productionData: any[] // BDP Reports
}

const COLORS = ["#3b82f6", "#ef4444", "#fbbf24", "#d946ef"]

function calculateDuration(start: string, end: string): number {
    try {
        if (!start || !end) return 0
        const today = new Date()
        const startDate = parse(start, 'HH:mm', today)
        const endDate = parse(end, 'HH:mm', today)

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0

        let diff = differenceInMinutes(endDate, startDate)
        if (diff < 0) diff += 24 * 60

        return diff
    } catch {
        return 0
    }
}

export function EquipmentKPIs({ equipments, productionData }: EquipmentKPIsProps) {
    const stats = useMemo(() => {
        const total = equipments.length
        const operational = equipments.filter(e => e.status === "Operacional").length
        const maintenance = equipments.filter(e => e.status === "Manutenção").length

        // Restore alerts calculation
        const alerts = equipments.filter(e => e.maintenanceInterval > 0 && e.hourmeter >= e.maintenanceInterval).length
        const totalProduction = productionData.reduce((acc, r) => acc + (Number(r.totalMeters) || 0), 0)

        // DF / UF Calculation
        let totalScheduledTime = 0
        let totalMaintenanceDowntime = 0
        let totalOperationalDowntime = 0

        productionData.forEach((report: any) => {
            let dailyScheduled = 0
            if (report.startTime && report.endTime) {
                dailyScheduled = calculateDuration(report.startTime, report.endTime)
            }

            if (dailyScheduled > 0) {
                totalScheduledTime += dailyScheduled

                if (report.occurrences && Array.isArray(report.occurrences)) {
                    report.occurrences.forEach((occ: any) => {
                        const duration = calculateDuration(occ.timeStart, occ.timeEnd)
                        if (duration > 0) {
                            const isMaintenance = [
                                "Mecânica", "Falta de peça", "Inspeção de equipamento",
                                "Falta de material de desgaste", "Aguardando limpeza"
                            ].includes(occ.type)

                            if (isMaintenance) {
                                totalMaintenanceDowntime += duration
                            } else {
                                totalOperationalDowntime += duration
                            }
                        }
                    })
                }
            }
        })

        let df = 0
        let uf = 0

        if (totalScheduledTime > 0) {
            const availableTime = totalScheduledTime - totalMaintenanceDowntime
            df = (availableTime / totalScheduledTime) * 100

            if (availableTime > 0) {
                const operatingTime = availableTime - totalOperationalDowntime
                uf = (operatingTime / availableTime) * 100
            }
        }

        return {
            total,
            operational,
            maintenance,
            availability: total > 0 ? ((operational / total) * 100).toFixed(0) : "0",
            alerts,
            totalProduction,
            df: Math.round(df * 10) / 10,
            uf: Math.round(uf * 10) / 10
        }
    }, [equipments, productionData])

    const chartData = useMemo(() => {
        // 1. Status Distribution
        const statusData = [
            { name: "Operacional", value: stats.operational, color: "#10b981" }, // Green
            { name: "Manutenção", value: stats.maintenance, color: "#ef4444" }, // Red
            { name: "Indisponível", value: stats.total - stats.operational - stats.maintenance, color: "#94a3b8" } // Gray
        ].filter(d => d.value > 0)

        // 2. Top Performers (Production by Drill)
        const productionByDrill: Record<string, number> = {}
        productionData.forEach(r => {
            const drillName = r.drill?.name || "Desconhecido"
            productionByDrill[drillName] = (productionByDrill[drillName] || 0) + (Number(r.totalMeters) || 0)
        })

        const topPerformers = Object.entries(productionByDrill)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)

        return { statusData, topPerformers }
    }, [equipments, productionData, stats])

    return (
        <div className="space-y-6 mb-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-md bg-white rounded-2xl ring-1 ring-slate-100/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-extrabold text-slate-500 uppercase tracking-widest">
                            Disp. Física (DF)
                        </CardTitle>
                        <div className="p-2.5 bg-blue-50/80 rounded-xl">
                            <Activity className="h-5 w-5 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-800 tracking-tight">{stats.df}%</div>
                        <p className="text-xs text-slate-400 font-bold mt-1">Tempo Disponível</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white rounded-2xl ring-1 ring-slate-100/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-extrabold text-slate-500 uppercase tracking-widest">
                            Total Produzido
                        </CardTitle>
                        <div className="p-2.5 bg-green-50/80 rounded-xl">
                            <Zap className="h-5 w-5 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-800 tracking-tight">{stats.totalProduction.toLocaleString('pt-BR')}m</div>
                        <p className="text-xs text-slate-400 font-bold mt-1">Performance Geral</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white rounded-2xl ring-1 ring-slate-100/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-extrabold text-slate-500 uppercase tracking-widest">
                            Util. Física (UF)
                        </CardTitle>
                        <div className="p-2.5 bg-purple-50/80 rounded-xl">
                            <Timer className="h-5 w-5 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-800 tracking-tight">{stats.uf}%</div>
                        <p className="text-xs text-slate-400 font-bold mt-1">Tempo Produtivo</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white rounded-2xl ring-1 ring-slate-100/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-extrabold text-slate-500 uppercase tracking-widest">
                            Alertas Preventivos
                        </CardTitle>
                        <div className="p-2.5 bg-orange-50/80 rounded-xl">
                            <Activity className="h-5 w-5 text-orange-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-800 tracking-tight">{stats.alerts}</div>
                        <p className="text-xs text-slate-400 font-bold mt-1">Revisões Pendentes</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Performers Chart */}
                <Card className="col-span-1 lg:col-span-2 border-none shadow-lg bg-white rounded-[24px] ring-1 ring-slate-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
                            <BarChart3 className="h-5 w-5 text-blue-500" />
                            Performance por Equipamento (Metros)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full">
                        {chartData.topPerformers.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData.topPerformers} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={100}
                                        className="text-xs font-bold text-slate-500"
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: '#f8fafc' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                        {chartData.topPerformers.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">
                                Sem dados de produção
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Status Distribution Chart */}
                <Card className="col-span-1 border-none shadow-lg bg-white rounded-[24px] ring-1 ring-slate-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
                            <PieChart className="h-5 w-5 text-purple-500" />
                            Status da Frota
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {chartData.statusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={chartData.statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                </RePieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">
                                Sem equipamentos
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2 justify-center mt-[-20px]">
                            {chartData.statusData.map((entry, index) => (
                                <div key={index} className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                    {entry.name} ({entry.value})
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
