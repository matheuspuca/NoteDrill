"use client"

import { useMemo } from "react"
import { InventoryItem } from "@/lib/schemas-inventory"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Package, TrendingUp, AlertTriangle, BadgeDollarSign, Archive } from "lucide-react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts"

interface InventoryAnalyticsProps {
    items: InventoryItem[]
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export function InventoryAnalytics({ items }: InventoryAnalyticsProps) {
    const metrics = useMemo(() => {
        const totalValue = items.reduce((acc, item) => acc + (Number(item.value || 0) * Number(item.quantity || 0)), 0)
        const totalItems = items.length
        const lowStockItems = items.filter(item => (item.quantity || 0) <= (item.minStock || 0))
        const lowStockCount = lowStockItems.length

        // Group by Project for Bar Chart
        const projectMap: Record<string, number> = {}
        items.forEach(item => {
            const projName = item.projects?.name || "Sem Obra"
            const val = Number(item.value || 0) * Number(item.quantity || 0)
            projectMap[projName] = (projectMap[projName] || 0) + val
        })
        const projectData = Object.entries(projectMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5) // Top 5

        // Group by Type for Pie Chart
        const typeMap: Record<string, number> = {}
        items.forEach(item => {
            const type = item.type || "Material"
            const val = Number(item.value || 0) * Number(item.quantity || 0)
            typeMap[type] = (typeMap[type] || 0) + val
        })
        const typeData = Object.entries(typeMap).map(([name, value]) => ({ name, value }))

        return {
            totalValue,
            totalItems,
            lowStockCount,
            projectData,
            typeData
        }
    }, [items])

    return (
        <div className="space-y-8 mb-10 overflow-hidden">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <BadgeDollarSign className="w-32 h-32" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium text-blue-100 uppercase tracking-wider">Valor em Estoque</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-extrabold pb-2">
                            R$ {metrics.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <p className="text-blue-100 text-sm font-medium">Investimento total acumulado</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg bg-white rounded-2xl ring-1 ring-slate-100">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Itens Cadastrados</CardTitle>
                        <Archive className="w-6 h-6 text-slate-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black text-slate-800">
                            {metrics.totalItems}
                        </div>
                        <p className="text-slate-400 text-sm mt-1">Materiais e Ferramentas ativos</p>
                    </CardContent>
                </Card>

                <Card className={`border-none shadow-lg rounded-2xl ring-1 ring-slate-100 ${metrics.lowStockCount > 0 ? 'bg-red-50' : 'bg-white'}`}>
                    <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className={`text-sm font-bold uppercase tracking-wider ${metrics.lowStockCount > 0 ? 'text-red-600' : 'text-slate-500'}`}>Estoque Baixo</CardTitle>
                        <AlertTriangle className={`w-6 h-6 ${metrics.lowStockCount > 0 ? 'text-red-500' : 'text-slate-400'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-black ${metrics.lowStockCount > 0 ? 'text-red-600' : 'text-slate-800'}`}>
                            {metrics.lowStockCount}
                        </div>
                        <p className={`${metrics.lowStockCount > 0 ? 'text-red-400' : 'text-slate-400'} text-sm mt-1`}>
                            {metrics.lowStockCount > 0 ? "Requer atenção imediata" : "Níveis de estoque saudáveis"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-lg rounded-2xl bg-white ring-1 ring-slate-100">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-slate-800">Distribuição Financeira por Obra</CardTitle>
                        <CardDescription>Top 5 obras com maior valor investido em materiais</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.projectData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fill: '#64748B' }} interval={0} />
                                <Tooltip
                                    formatter={(value: number | undefined) => [`R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg rounded-2xl bg-white ring-1 ring-slate-100">
                    <CardHeader>
                        <CardTitle className="text-xl font-bold text-slate-800">Composição por Categoria</CardTitle>
                        <CardDescription>Valor proporcional entre Materiais, EPIs e Ferramentas</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={metrics.typeData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {metrics.typeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number | undefined) => [`R$ ${(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Valor']}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
