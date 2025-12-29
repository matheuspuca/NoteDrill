"use client"

import React from "react"
import {
    Plus,
    TrendingUp,
    AlertTriangle,
    Activity,
    ArrowUpRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// Recharts imports handling (Client side)
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts'

const productionData = [
    { name: 'Jan', value: 4000 },
    { name: 'Fev', value: 3000 },
    { name: 'Mar', value: 2000 },
    { name: 'Abr', value: 2780 },
    { name: 'Mai', value: 1890 },
    { name: 'Jun', value: 2390 },
    { name: 'Jul', value: 3490 },
]

const recentProjects = [
    { id: "1", name: "Mina Serra Azul", client: "Vale S.A.", status: "Em Produção", progress: 85, color: "bg-green-100 text-green-700" },
    { id: "2", name: "Pedreira Norte", client: "Votorantim", status: "Planejamento", progress: 10, color: "bg-blue-100 text-blue-700" },
    { id: "3", name: "Túnel Rodoanel", client: "Estado SP", status: "Parado", progress: 45, color: "bg-red-100 text-red-700" },
    { id: "4", name: "Expansão Leste", client: "CSN", status: "Em Produção", progress: 60, color: "bg-green-100 text-green-700" },
]

export default function DashboardPage() {
    return (
        <div className="space-y-10 max-w-[1800px] mx-auto pb-10">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">Painel de Controle</h1>
                    <p className="text-xl text-slate-500 mt-2 font-medium">Visão geral da sua operação em tempo real.</p>
                </div>
                <Button className="bg-[#2563EB] hover:bg-blue-700 text-white shadow-xl shadow-blue-500/20 rounded-xl h-14 px-8 text-lg font-bold transition-all hover:scale-105">
                    <Plus className="mr-2 h-6 w-6" /> Novo Projeto
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* KPI 1: Produção */}
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 rounded-3xl">
                    <CardContent className="p-10">
                        <div className="flex justify-between items-start mb-8">
                            <div className="p-5 bg-blue-50 rounded-2xl">
                                <Activity className="h-10 w-10 text-blue-600" />
                            </div>
                            <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 text-base px-4 py-1.5 font-bold rounded-full">
                                +12% <ArrowUpRight className="ml-1 h-4 w-4" />
                            </Badge>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-slate-500 uppercase tracking-widest">Produção Total (Mês)</p>
                            <h3 className="text-6xl font-black text-slate-900 mt-3 tracking-tighter">14.250m</h3>
                        </div>
                    </CardContent>
                </Card>

                {/* KPI 2: Equipamentos */}
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 rounded-3xl">
                    <CardContent className="p-10">
                        <div className="flex justify-between items-start mb-8">
                            <div className="p-5 bg-orange-50 rounded-2xl">
                                <AlertTriangle className="h-10 w-10 text-orange-500" />
                            </div>
                            <Badge variant="outline" className="border-2 border-orange-100 text-orange-600 bg-orange-50 text-base px-4 py-1.5 font-bold rounded-full">
                                Tempo Real
                            </Badge>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-slate-500 uppercase tracking-widest">Equipamentos Parados</p>
                            <h3 className="text-6xl font-black text-slate-900 mt-3 tracking-tighter">
                                03 <span className="text-3xl text-slate-400 font-bold ml-1">/ 12</span>
                            </h3>
                        </div>
                    </CardContent>
                </Card>

                {/* KPI 3: Eficiência */}
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 rounded-3xl">
                    <CardContent className="p-10">
                        <div className="flex justify-between items-start mb-8">
                            <div className="p-5 bg-green-50 rounded-2xl">
                                <TrendingUp className="h-10 w-10 text-green-600" />
                            </div>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-slate-500 uppercase tracking-widest">Eficiência Operacional</p>
                            <h3 className="text-6xl font-black text-slate-900 mt-3 tracking-tighter">94.5%</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts & Tables Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">

                {/* Main Chart */}
                <Card className="xl:col-span-2 border-none shadow-lg rounded-3xl">
                    <CardHeader className="p-10 pb-2">
                        <CardTitle className="text-3xl font-extrabold text-slate-800">Performance de Perfuração</CardTitle>
                    </CardHeader>
                    <CardContent className="p-10 pt-6">
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={productionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 16, fontWeight: 600 }} dy={15} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 16, fontWeight: 600 }} dx={-10} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '16px' }}
                                        itemStyle={{ color: '#1E293B', fontWeight: 700, fontSize: '16px' }}
                                        cursor={{ stroke: '#2563EB', strokeWidth: 2 }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={5} fillOpacity={1} fill="url(#colorValue)" activeDot={{ r: 8, strokeWidth: 0, fill: '#2563EB' }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Projects Table */}
                <Card className="border-none shadow-lg flex flex-col rounded-3xl">
                    <CardHeader className="flex flex-row items-center justify-between p-10 pb-6">
                        <CardTitle className="text-3xl font-extrabold text-slate-800">Obras em Andamento</CardTitle>
                        <Button variant="ghost" className="text-blue-600 hover:text-blue-700 text-lg font-bold">Ver Todas</Button>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-100 hover:bg-transparent">
                                    <TableHead className="font-extrabold text-slate-400 pl-10 h-16 text-sm uppercase tracking-wider">Obra</TableHead>
                                    <TableHead className="font-extrabold text-slate-400 text-right pr-10 h-16 text-sm uppercase tracking-wider">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentProjects.map((project) => (
                                    <TableRow key={project.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-10 py-6">
                                            <div className="font-extrabold text-xl text-slate-800">{project.name}</div>
                                            <div className="text-base font-semibold text-slate-500 mt-1.5">{project.client}</div>
                                        </TableCell>
                                        <TableCell className="text-right pr-10 py-6">
                                            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${project.color}`}>
                                                {project.status}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
