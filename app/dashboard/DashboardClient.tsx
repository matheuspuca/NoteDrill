"use client"

import React from "react"
import {
    Activity,
    TrendingUp,
    AlertTriangle,
    ArrowUpRight,
    Package,
    Drill,
    Hammer,
    Fuel,
    Zap,
    Timer,
    AlertOctagon
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell
} from 'recharts'
import { SCurveChart } from "@/components/bdp/SCurveChart"
import { DashboardKPIs, ChartData, SCurveData } from "./analytics-types"
import Link from "next/link"
import { DateRangePicker } from "@/components/dashboard/DateRangePicker"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface ProjectOption {
    id: string
    name: string
}

interface DashboardClientProps {
    kpis: DashboardKPIs
    productionTrend: ChartData[]
    projectRanking: ChartData[]
    bottlenecks: ChartData[]
    projects: ProjectOption[]
    sCurveData?: SCurveData | null
}

export function DashboardClient({ kpis, productionTrend, projectRanking, bottlenecks, projects, sCurveData }: DashboardClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const selectedProjectId = searchParams.get('projectId') ?? "all"

    const handleProjectChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value && value !== "all") {
            params.set('projectId', value)
        } else {
            params.delete('projectId')
        }
        router.replace(`/dashboard?${params.toString()}`)
        router.refresh()
    }

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            {/* Header Section */}

            <div className="flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Painel de Controle</h1>
                    <p className="text-base md:text-lg text-slate-500 mt-2 font-medium">Visão geral inteligente da sua operação.</p>
                </div>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="w-full md:w-auto">
                        <DateRangePicker />
                    </div>
                    <Select value={selectedProjectId} onValueChange={handleProjectChange}>
                        <SelectTrigger className="w-full md:w-[200px] h-12 rounded-xl bg-white border-slate-200">
                            <SelectValue placeholder="Todas as Obras" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas as Obras</SelectItem>
                            {projects.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Link href="/dashboard/bdp/new" className="w-full md:w-auto">
                        <Button className="w-full md:w-auto bg-[#2563EB] hover:bg-blue-700 text-white shadow-lg rounded-xl h-12 px-6 font-bold transition-all hover:scale-105">
                            Novo BDP
                        </Button>
                    </Link>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                {/* KPI 1: Produção */}
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 rounded-[24px] overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity className="w-24 h-24 text-blue-600" />
                    </div>
                    <CardContent className="p-6 md:p-8">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-100/50 rounded-xl text-blue-700">
                                <Activity className="h-8 w-8" />
                            </div>
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                                Mensal
                            </Badge>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Produção (Mês)</p>
                            <h3 className="text-4xl font-black text-slate-900 mt-2 tracking-tighter">
                                {kpis.totalProduction.toLocaleString('pt-BR')}m
                            </h3>
                        </div>
                    </CardContent>
                </Card>

                {/* KPI 2: Eficiência */}
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 rounded-[24px] overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp className="w-24 h-24 text-emerald-600" />
                    </div>
                    <CardContent className="p-6 md:p-8">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-100/50 rounded-xl text-emerald-700">
                                <TrendingUp className="h-8 w-8" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Eficiência Média</p>
                            <h3 className="text-4xl font-black text-slate-900 mt-2 tracking-tighter">
                                {kpis.efficiency.toLocaleString('pt-BR')} <span className="text-lg text-slate-400 font-bold">m/h</span>
                            </h3>
                        </div>
                    </CardContent>
                </Card>

                {/* KPI 3: Frota (Removed as per request - Migrated to Equipment Page) */}



                {/* KPI 4: Diesel Consumption */}
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 rounded-[24px] overflow-hidden relative group bg-gradient-to-br from-yellow-50 to-white">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Fuel className="w-24 h-24 text-yellow-600" />
                    </div>
                    <CardContent className="p-6 md:p-8">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-yellow-100/50 rounded-xl text-yellow-700">
                                <Fuel className="h-8 w-8" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Consumo Diesel</p>
                            <h3 className="text-4xl font-black text-slate-900 mt-2 tracking-tighter">
                                {kpis.dieselConsumption.toLocaleString('pt-BR')} <span className="text-xl text-slate-400 font-bold">L</span>
                            </h3>
                            <div className="flex gap-2 mt-2">
                                {kpis.dieselPerMeter !== undefined && (
                                    <p className="text-xs font-bold text-yellow-600 bg-yellow-100/50 px-2 py-1 rounded-md">
                                        {kpis.dieselPerMeter.toFixed(2)} L/m
                                    </p>
                                )}
                                {kpis.dieselPerHour !== undefined && (
                                    <p className="text-xs font-bold text-orange-600 bg-orange-100/50 px-2 py-1 rounded-md">
                                        {kpis.dieselPerHour.toFixed(2)} L/h
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* KPI 5: Valor em Estoque */}
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 rounded-[24px] overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Package className="w-24 h-24 text-purple-600" />
                    </div>
                    <CardContent className="p-6 md:p-8">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-100/50 rounded-xl text-purple-700">
                                <Package className="h-8 w-8" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Valor em Estoque</p>
                            <h3 className="text-3xl font-black text-slate-900 mt-2 tracking-tighter truncate" title={formatCurrency(kpis.inventoryValuation)}>
                                {formatCurrency(kpis.inventoryValuation)}
                            </h3>
                        </div>
                    </CardContent>
                </Card>

                {/* KPI 6: Performance Média Bit */}
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 rounded-[24px] overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap className="w-24 h-24 text-indigo-600" />
                    </div>
                    <CardContent className="p-6 md:p-8">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-100/50 rounded-xl text-indigo-700">
                                <Zap className="h-8 w-8" />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Performance Média Bit</p>
                            <h3 className="text-4xl font-black text-slate-900 mt-2 tracking-tighter">
                                {kpis.bitPerformance || 0} <span className="text-lg text-slate-400 font-bold">m/un</span>
                            </h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* S-Curve or Trend Chart */}
                {sCurveData ? (
                    <div className="xl:col-span-3">
                        <SCurveChart
                            startDate={sCurveData.startDate}
                            targetMeters={sCurveData.targetMeters}
                            realizedData={sCurveData.realizedData}
                        />
                    </div>
                ) : null}

                {/* Main Trend Chart - Only show if S-Curve is NOT shown, or show both?
                    Request said: "transferir esse grafico ... para o dashboard".
                    Usually S-Curve is the main view for a project.
                    The Trend Chart (30 days) is good for "All" or "Recent".
                    Let's show Trend Chart if S-Curve is NOT present (i.e. 'All' Selected) 
                    OR allow both?
                    S-Curve is HUGE (col-span-3 in BDPKPIs).
                    I'll put S-Curve FULL WIDTH if active.
                    And keep Trend Chart below or hide it?
                    If I select a project, I definitely want S-Curve.
                    The Trend Chart is redundant? Maybe not, Trend is per day bar/area.
                    S-Curve is Cumulative Line.
                    I will show both for now, but ensure layout works.
                */}

                {/* Main Trend Chart */}
                <Card className="xl:col-span-2 border-none shadow-lg rounded-[32px]">
                    <CardHeader className="p-6 pb-2 md:p-8 md:pb-2">
                        <CardTitle className="text-2xl font-bold text-slate-800">Tendência de Produção (30 dias)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-4">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={productionTrend} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                                    <defs>
                                        <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                                        dy={10}
                                        minTickGap={30}
                                        label={{ value: 'Período', position: 'insideBottom', offset: -10, fill: '#94A3B8', fontSize: 12 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 600 }}
                                        label={{ value: 'Produção (m)', angle: -90, position: 'insideLeft', offset: 10, fill: '#94A3B8', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                        itemStyle={{ color: '#1E293B', fontWeight: 700 }}
                                        cursor={{ stroke: '#2563EB', strokeWidth: 2 }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={4} fillOpacity={1} fill="url(#colorProd)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Ranking Chart */}
                <Card className="border-none shadow-lg rounded-[32px] bg-slate-900 text-white">
                    <CardHeader className="p-6 pb-2 md:p-8 md:pb-2">
                        <CardTitle className="text-2xl font-bold text-white">Top Obras</CardTitle>
                        <p className="text-slate-400 font-medium">Ranking por produção total</p>
                    </CardHeader>
                    <CardContent className="p-8 pt-4">
                        <div className="h-[200px] w-full mb-8 border-b border-slate-700 pb-8 min-w-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={projectRanking} margin={{ top: 0, right: 30, left: 15, bottom: 20 }}>
                                    <XAxis type="number" hide={false} tick={{ fill: '#E2E8F0', fontSize: 10 }} label={{ value: 'Produção (m)', position: 'insideBottom', offset: -5, fill: '#E2E8F0', fontSize: 12 }} />
                                    <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#E2E8F0', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} label={{ value: 'Obras', angle: -90, position: 'insideLeft', fill: '#E2E8F0', fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                                        contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: '1px solid #334155', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                                        {projectRanking.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#3B82F6' : index === 1 ? '#60A5FA' : '#94A3B8'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="h-[200px] w-full min-w-0">
                            <div className="mb-4">
                                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                    <AlertOctagon className="w-5 h-5 text-red-400" />
                                    Principais Gargalos (Horas)
                                </h4>
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={bottlenecks} margin={{ top: 0, right: 30, left: 10, bottom: 20 }}>
                                    <XAxis type="number" hide={false} tick={{ fill: '#E2E8F0', fontSize: 10 }} label={{ value: 'Horas', position: 'insideBottom', offset: -5, fill: '#E2E8F0', fontSize: 12 }} />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#E2E8F0', fontSize: 10, fontWeight: 500 }} axisLine={false} tickLine={false} textAnchor="end" />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                                        contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: '1px solid #334155', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                                        {bottlenecks.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={'#EF4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
