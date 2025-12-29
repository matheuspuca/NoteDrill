"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, HardHat, TrendingUp, Clock, Activity, BarChart3, PieChart } from "lucide-react"
import { BDP } from "@/lib/schemas-bdp"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart as RePieChart,
    Pie,
    Cell,
} from "recharts"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface BDPKPIsProps {
    reports: BDP[]
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#6366f1"]

export function BDPKPIs({ reports }: BDPKPIsProps) {
    const stats = useMemo(() => {
        const totalMeters = reports.reduce((acc, r) => acc + (Number(r.totalMeters) || 0), 0)
        const totalHours = reports.reduce((acc, r) => acc + (Number(r.totalHours) || 0), 0)
        const avgProduction = totalHours > 0 ? (totalMeters / totalHours).toFixed(1) : "0.0"

        // Count distinct active operators
        const uniqueOperators = new Set(reports.map(r => r.operatorId).filter(Boolean)).size

        return {
            totalMeters,
            totalHours,
            avgProduction,
            uniqueOperators
        }
    }, [reports])

    const chartData = useMemo(() => {
        // Group by date for Trend Chart (Last 7 entries or all sorted)
        // We'll take the provided reports order (which is usually desc date) and reverse for chart
        // Limit to last 14 records for readability if needed, or map all.
        // Assuming reports are sorted desc.
        const reversed = [...reports].reverse()

        // Map for Bar Chart
        const dailyProduction = reversed.map(r => ({
            date: r.date ? format(new Date(r.date), "dd/MM", { locale: ptBR }) : "-",
            meters: Number(r.totalMeters) || 0,
            fullDate: r.date // for tooltip
        }))

        // Group by Operator for Pie Chart
        const operatorStats: Record<string, number> = {}
        reports.forEach(r => {
            const name = r.operator?.name || "Desconhecido"
            operatorStats[name] = (operatorStats[name] || 0) + (Number(r.totalMeters) || 0)
        })
        const operatorData = Object.entries(operatorStats)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5) // Top 5

        return { dailyProduction, operatorData }
    }, [reports])

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-md bg-white rounded-2xl ring-1 ring-slate-100/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-extrabold text-slate-500 uppercase tracking-widest">
                            Total Perfurado
                        </CardTitle>
                        <div className="p-2.5 bg-blue-50/80 rounded-xl">
                            <HardHat className="h-5 w-5 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-800 tracking-tight">{stats.totalMeters.toLocaleString('pt-BR')}m</div>
                        <p className="text-xs text-slate-400 font-bold mt-1">Neste período</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white rounded-2xl ring-1 ring-slate-100/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-extrabold text-slate-500 uppercase tracking-widest">
                            Produtividade Média
                        </CardTitle>
                        <div className="p-2.5 bg-green-50/80 rounded-xl">
                            <Activity className="h-5 w-5 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-800 tracking-tight">{stats.avgProduction} <span className="text-lg text-slate-400 font-bold">m/h</span></div>
                        <p className="text-xs text-slate-400 font-bold mt-1">Eficiência Operacional</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white rounded-2xl ring-1 ring-slate-100/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-extrabold text-slate-500 uppercase tracking-widest">
                            Horas Trabalhadas
                        </CardTitle>
                        <div className="p-2.5 bg-orange-50/80 rounded-xl">
                            <Clock className="h-5 w-5 text-orange-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-800 tracking-tight">{stats.totalHours.toLocaleString('pt-BR')}h</div>
                        <p className="text-xs text-slate-400 font-bold mt-1">Total acumulado</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md bg-white rounded-2xl ring-1 ring-slate-100/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-extrabold text-slate-500 uppercase tracking-widest">
                            Operadores Ativos
                        </CardTitle>
                        <div className="p-2.5 bg-purple-50/80 rounded-xl">
                            <Users className="h-5 w-5 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-800 tracking-tight">{stats.uniqueOperators}</div>
                        <p className="text-xs text-slate-400 font-bold mt-1">Equipe engajada</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Production Trend */}
                <Card className="col-span-1 lg:col-span-2 border-none shadow-lg bg-white rounded-[24px] ring-1 ring-slate-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
                            <BarChart3 className="h-5 w-5 text-blue-500" />
                            Produção Diária (Metros)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full">
                        {chartData.dailyProduction.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData.dailyProduction}>
                                    <defs>
                                        <linearGradient id="colorMeters" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        className="text-xs font-bold text-slate-400"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10}
                                    />
                                    <YAxis
                                        className="text-xs font-bold text-slate-400"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={10}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="meters"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorMeters)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">
                                Sem dados para o gráfico
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Operator Share */}
                <Card className="col-span-1 border-none shadow-lg bg-white rounded-[24px] ring-1 ring-slate-100">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
                            <PieChart className="h-5 w-5 text-purple-500" />
                            Top Operadores
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {chartData.operatorData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={chartData.operatorData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.operatorData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                </RePieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">
                                Sem dados
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2 justify-center mt-[-20px]">
                            {chartData.operatorData.map((entry, index) => (
                                <div key={index} className="flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                    {entry.name}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
