
"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Calendar, Target } from "lucide-react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts"
import { format, differenceInDays, addDays, isAfter, isBefore, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

interface SCurveChartProps {
    startDate?: string | null
    targetMeters?: number | null
    realizedData: { date: string, meters: number }[] // Daily production
    endDate?: string | null
}

export function SCurveChart({ startDate, targetMeters, realizedData, endDate }: SCurveChartProps) {

    const chartData = useMemo(() => {
        if (!startDate || !targetMeters) return []

        const start = parseISO(startDate)
        const today = new Date()

        const dataPoints = []
        // Pre-calculate accumulated realized before start date
        let cumulativeRealized = 0
        realizedData.forEach(d => {
            // If date is BEFORE start date, add to initial sum
            if (d.date < format(start, "yyyy-MM-dd")) {
                cumulativeRealized += d.meters
            }
        })

        // Target Calculation Setup
        const end = endDate ? parseISO(endDate) : addDays(start, 30) // Fallback 30 days if no end date
        const totalDurationDays = differenceInDays(end, start) + 1
        const metersPerDay = targetMeters / Math.max(totalDurationDays, 1)

        // Loop from Start Date to Max(Today, End Date)
        const chartEnd = isAfter(today, end) ? today : end
        const chartDays = differenceInDays(chartEnd, start) + 1

        // We need a map of realized meters by date for quick lookup
        const realizedMap = new Map<string, number>()
        realizedData.forEach(d => {
            realizedMap.set(d.date, (realizedMap.get(d.date) || 0) + d.meters)
        })

        for (let i = 0; i < chartDays; i++) {
            const current = addDays(start, i)
            const dateStr = format(current, "yyyy-MM-dd")
            const displayDate = format(current, "dd/MM")

            // Realized Accumulation
            if (realizedMap.has(dateStr)) {
                cumulativeRealized += realizedMap.get(dateStr)!
            }

            // Target Calculation (Linear)
            let linearTarget = 0
            if (i <= totalDurationDays) { // Linear growth until end date
                linearTarget = (i / Math.max(totalDurationDays, 1)) * targetMeters
                if (linearTarget > targetMeters) linearTarget = targetMeters
            } else { // Flat after end date
                linearTarget = targetMeters
            }

            const isFuture = isAfter(current, today)

            dataPoints.push({
                date: displayDate,
                fullDate: dateStr,
                realized: isFuture ? null : cumulativeRealized,
                target: linearTarget
            })
        }

        return dataPoints

    }, [startDate, targetMeters, realizedData, endDate])

    return (
        <Card className="col-span-1 lg:col-span-3 border-none shadow-lg bg-white rounded-[24px] ring-1 ring-slate-100">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Curva S de Avanço Físico
                </CardTitle>
                <div className="flex gap-4 text-sm font-medium text-slate-500">
                    {startDate && (
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" /> Início: {format(parseISO(startDate), "dd/MM/yyyy")}
                        </div>
                    )}
                    {targetMeters && (
                        <div className="flex items-center gap-1">
                            <Target className="h-4 w-4" /> Meta: {targetMeters.toLocaleString('pt-BR')}m
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="date"
                            className="text-xs font-bold text-slate-400"
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                        />
                        <YAxis
                            className="text-xs font-bold text-slate-400"
                            tickLine={false}
                            axisLine={false}
                            label={{ value: 'Metros Acumulados', angle: -90, position: 'insideLeft', offset: 10, fill: '#94A3B8', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line
                            type="monotone"
                            dataKey="realized"
                            name="Realizado"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{ r: 6 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="target"
                            name="Meta Linear"
                            stroke="#94a3b8"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
