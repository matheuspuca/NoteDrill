
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
}

export function SCurveChart({ startDate, targetMeters, realizedData }: SCurveChartProps) {

    const chartData = useMemo(() => {
        if (!startDate || !targetMeters) return []

        const start = parseISO(startDate)
        const today = new Date()

        // Determine end date for the chart (either today or last realized date, whichever is later)
        // Or maybe project end? For now let's project until today or minor future
        // Ideally we project until target is met or fixed duration. 
        // Let's go from Start Date until Today + 7 days

        const daysSinceStart = differenceInDays(today, start) + 1
        // If start date is in future, return empty
        if (daysSinceStart < 0) return []

        const dataPoints = []
        let cumulativeRealized = 0

        // We need a map of realized meters by date
        const realizedMap = new Map<string, number>()
        realizedData.forEach(d => {
            const dateStr = d.date // YYYY-MM-DD
            realizedMap.set(dateStr, (realizedMap.get(dateStr) || 0) + d.meters)
        })

        // Generate points
        // We will plot until today for Realized, but maybe Project Target Line extends?
        // Let's assume a linear target distribution over... what duration?
        // Typically S-Curve needs an END DATE to draw the Target Curve.
        // If we don't have an End Date, we can't draw a target curve easily unless we have a daily target.
        // The migration didn't ask for End Date, but `projects` table ALREADY HAS `end_date`.
        // Let's assume we pass `endDate` too? Or calculate daily target?
        // The implementation plan mentioned "Linear accumulation from start_date to today (or project end)".
        // We need to fetch Project End Date too.

        // Workaround: If no end date, maybe assume 30 days or dynamic?
        // Let's assume we will pass endDate prop. If missing, maybe flat target?
        // No, let's just create the Logic placeholder. 

        // Realized Curve Construction
        const sortedRealizedDates = Array.from(realizedMap.keys()).sort()
        const firstRealized = sortedRealizedDates[0]
        const lastRealized = sortedRealizedDates[sortedRealizedDates.length - 1]

        // Loop from Start Date to Today
        for (let i = 0; i <= Math.max(daysSinceStart, 1); i++) {
            const current = addDays(start, i)
            const dateStr = format(current, "yyyy-MM-dd")
            const displayDate = format(current, "dd/MM")

            // Realized
            if (realizedMap.has(dateStr)) {
                cumulativeRealized += realizedMap.get(dateStr)!
            }

            // Only push realized if date <= today
            const isFuture = isAfter(current, today)

            dataPoints.push({
                date: displayDate,
                fullDate: dateStr,
                realized: isFuture ? null : cumulativeRealized,
                target: null // Filled later
            })
        }

        return dataPoints

    }, [startDate, targetMeters, realizedData])

    // Re-calc with End Date logic if passed (we will add it to props)
    // For now, let's return what we have.

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
                        {/* Target Line would go here */}
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
