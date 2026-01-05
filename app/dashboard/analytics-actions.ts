"use server"

import { createClient } from "@/lib/supabase/server"
import { startOfMonth, subDays, format, parseISO, endOfMonth, eachDayOfInterval, differenceInMinutes, parse } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DashboardKPIs, ChartData } from "./analytics-types"

function calculateDuration(start: string, end: string): number {
    try {
        if (!start || !end) return 0
        // Try calculate diff between HH:mm strings
        const today = new Date()
        const startDate = parse(start, 'HH:mm', today)
        const endDate = parse(end, 'HH:mm', today)

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0

        let diff = differenceInMinutes(endDate, startDate)
        if (diff < 0) diff += 24 * 60 // Handle midnight crossing if necessary (though simple BDP usually same shift)

        return diff // minutes
    } catch (e) {
        console.error("Error calculating duration:", e)
        return 0
    }
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return {
        totalProduction: 0,
        efficiency: 0,
        equipmentUtilization: { active: 0, total: 0, percentage: 0 },
        inventoryValuation: 0,
        activeProjects: 0,

        dieselConsumption: 0,
        downtime: 0,
        topBottleneck: "N/A",
        costPerMeter: 0,
        projectViabilityIndex: 0
    }

    const today = new Date()
    const startMonth = startOfMonth(today).toISOString()
    const endMonth = endOfMonth(today).toISOString()

    // 1. Fetch BDPs for Current Month (Production, Efficiency, Diesel)
    const { data: monthlyBdps } = await supabase
        .from("bdp_reports")
        .select("totalMeters, totalHours, supplies, occurrences")
        .eq("user_id", user.id)
        .gte("date", startMonth)
        .lte("date", endMonth)

    const totalProduction = monthlyBdps?.reduce((acc, curr) => acc + (Number(curr.totalMeters) || 0), 0) || 0
    const totalHours = monthlyBdps?.reduce((acc, curr) => acc + (Number(curr.totalHours) || 0), 0) || 0
    const efficiency = totalHours > 0 ? (totalProduction / totalHours) : 0

    // Calculate Downtime & Bottlenecks
    const bottleneckMap: Record<string, number> = {}
    let totalDowntime = 0

    monthlyBdps?.forEach(report => {
        const occurrences = report.occurrences as any[] | null
        if (occurrences && Array.isArray(occurrences)) {
            occurrences.forEach((occ: any) => {
                const duration = calculateDuration(occ.timeStart, occ.timeEnd)
                if (duration > 0) {
                    totalDowntime += duration
                    bottleneckMap[occ.type] = (bottleneckMap[occ.type] || 0) + duration
                }
            })
        }
    })

    // Find Top Bottleneck
    let topBottleneck = "Nenhum"
    let maxDuration = 0
    for (const [type, duration] of Object.entries(bottleneckMap)) {
        if (duration > maxDuration) {
            maxDuration = duration
            topBottleneck = type
        }
    }

    // Calculate Diesel Consumption
    const dieselConsumption = monthlyBdps?.reduce((acc, report) => {
        // supplies is likely a JSON b/c it's an array in schema
        const supplies = report.supplies as any[] | null
        if (!supplies || !Array.isArray(supplies)) return acc

        const reportDiesel = supplies
            .filter((s: any) => s.type && s.type.includes("Diesel"))
            .reduce((sum: number, s: any) => sum + (Number(s.quantity) || 0), 0)

        return acc + reportDiesel
    }, 0) || 0

    // 2. Fetch Equipment for Utilization
    const { data: equipments } = await supabase
        .from("equipment")
        .select("status")
        .eq("user_id", user.id)

    const totalEquipments = equipments?.length || 0
    const activeEquipments = equipments?.filter(e => e.status === "Operacional").length || 0
    const utilPercentage = totalEquipments > 0 ? Math.round((activeEquipments / totalEquipments) * 100) : 0



    // 3. Fetch Inventory (Items + EPIs) for Valuation
    const { data: inventory } = await supabase
        .from("inventory_items")
        .select("quantity, value")
        .eq("user_id", user.id)

    const { data: epis } = await supabase
        .from("inventory_epis")
        .select("quantity, value")
        .eq("user_id", user.id)

    const itemsValuation = inventory?.reduce((acc, curr) => {
        const qty = Number(curr.quantity) || 0
        const price = Number(curr.value) || 0
        return acc + (qty * price)
    }, 0) || 0

    const episValuation = epis?.reduce((acc, curr) => {
        const qty = Number(curr.quantity) || 0
        const price = Number(curr.value) || 0
        return acc + (qty * price)
    }, 0) || 0

    const inventoryValuation = itemsValuation + episValuation

    // 4. Active Projects
    const { count: projectCount } = await supabase
        .from("projects")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id)
        .eq("status", "Em Andamento") // Assuming status field exists, otherwise logic needs check

    // 5. Cost per Meter Calculation (Updated v2.2)
    // Numerador = (Insumos) + (Mão de Obra) + (Depreciação/Aluguel) + (Manutenção)

    // A. Insumos (Diesel + Outros já incluídos na varredura de 'supplies' acima? Não, só calculamos Diesel. Ideal seria calc tudo)
    // Para simplificar e manter compatibilidade, vamos usar o Inventory Valuation como base parcial ou somar supplies dos BDPs.
    // Vamos usar a estimativa de Diesel como "consumíveis" por enquanto ou melhorar se possível.
    const avgDieselPrice = 6.50
    const fuelCost = dieselConsumption * avgDieselPrice

    // B. Mão de Obra (Placeholder - será vindo de Projects no futuro)
    const laborCost = 15000 // Estimativa mensal fixa por enquanto

    // C. Depreciação / Aluguel (Equipamentos)
    // Fetch rental/depreciation costs
    const { data: equipCosts } = await supabase
        .from("equipment")
        .select("ownership_type, rental_cost_monthly, depreciation_cost_monthly")
        .eq("user_id", user.id)

    const fixedAssetCost = equipCosts?.reduce((acc, eq) => {
        const cost = eq.ownership_type === 'RENTED'
            ? (Number(eq.rental_cost_monthly) || 0)
            : (Number(eq.depreciation_cost_monthly) || 0)
        return acc + cost
    }, 0) || 0

    // D. Manutenção (Events in Period)
    const { data: maintEvents } = await supabase
        .from("maintenance_events")
        .select("cost")
        .eq("user_id", user.id)
        .gte("date", startMonth)
        .lte("date", endMonth)

    const maintenanceCost = maintEvents?.reduce((acc, evt) => acc + (Number(evt.cost) || 0), 0) || 0

    const totalCostOfMonth = fuelCost + laborCost + fixedAssetCost + maintenanceCost
    const costPerMeter = totalProduction > 0 ? (totalCostOfMonth / totalProduction) : 0

    // 6. Project Viability Index (Simplified)
    // Based on High Efficiency (>30m/h) and Low Downtime (<10%)
    // Normalized to 0-100
    const efficiencyScore = Math.min(efficiency / 40, 1) * 50 // Max 50 pts
    const downtimePercentage = totalHours > 0 ? (totalDowntime / 60) / totalHours : 0
    const downtimeScore = Math.max(0, 1 - (downtimePercentage / 0.20)) * 50 // Max 50 pts
    const projectViabilityIndex = Math.round(efficiencyScore + downtimeScore)

    // 7. Bit Performance (Metros / Unidade)
    let bitPerformance = 0
    try {
        const { count: bitCount, error: bitError } = await supabase
            .from('bit_instances')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

        if (!bitError && bitCount && bitCount > 0) {
            const { data: bdpBits, error: bdpError } = await supabase
                .from('bdp_reports')
                .select('totalMeters')
                .eq('user_id', user.id)
                .not('bit_instance_id', 'is', null)

            if (!bdpError && bdpBits) {
                const totalBitMeters = bdpBits.reduce((acc, curr) => acc + (Number(curr.totalMeters) || 0), 0)
                bitPerformance = totalBitMeters / bitCount
            }
        }
    } catch (e) {
        console.warn("Bit Performance calc failed (likely pending migration):", e)
    }

    return {
        totalProduction: Math.round(totalProduction * 10) / 10,
        efficiency: Math.round(efficiency * 10) / 10,
        equipmentUtilization: {
            active: activeEquipments,
            total: totalEquipments,
            percentage: utilPercentage
        },
        inventoryValuation,
        activeProjects: projectCount || 0,
        dieselConsumption: Math.round(dieselConsumption),
        downtime: totalDowntime,
        topBottleneck,
        costPerMeter: Math.round(costPerMeter * 100) / 100,
        projectViabilityIndex,
        bitPerformance: Math.round(bitPerformance * 10) / 10
    }
}

export async function getBottleneckAnalysis(): Promise<ChartData[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const endDate = new Date()
    const startDate = subDays(endDate, 30)

    const { data: reports } = await supabase
        .from("bdp_reports")
        .select("occurrences")
        .eq("user_id", user.id)
        .gte("date", startDate.toISOString())
        .lte("date", endDate.toISOString())

    const bottleneckMap: Record<string, number> = {}

    try {
        reports?.forEach(report => {
            const occurrences = report.occurrences as any[] | null
            if (occurrences && Array.isArray(occurrences)) {
                occurrences.forEach((occ: any) => {
                    const duration = calculateDuration(occ.timeStart, occ.timeEnd)
                    if (duration > 0) {
                        bottleneckMap[occ.type] = (bottleneckMap[occ.type] || 0) + duration
                    }
                })
            }
        })
    } catch (error) {
        console.error("Error processing bottlenecks:", error)
        return []
    }

    // Convert to ChartData and Sort
    const data = Object.entries(bottleneckMap)
        .map(([name, value]) => ({
            name,
            value: Math.round(value / 60 * 10) / 10 // Convert minutes to Hours
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6) // Top 6

    return data
}

export async function getProductionTrend(): Promise<ChartData[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const endDate = new Date()
    const startDate = subDays(endDate, 30) // Last 30 days

    // Fetch reports
    const { data: reports } = await supabase
        .from("bdp_reports")
        .select("date, totalMeters")
        .eq("user_id", user.id)
        .gte("date", startDate.toISOString())
        .lte("date", endDate.toISOString())
        .order("date", { ascending: true })

    // Generate all days in interval to avoid gaps
    const interval = eachDayOfInterval({ start: startDate, end: endDate })

    // Aggregate by date
    const groupedData = interval.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        const dayReports = reports?.filter(r => r.date?.startsWith(dateStr))
        const total = dayReports?.reduce((acc, curr) => acc + (Number(curr.totalMeters) || 0), 0) || 0

        return {
            name: format(day, 'dd/MM'), // Display format
            value: total
        }
    })

    return groupedData
}

export async function getProjectRanking(): Promise<ChartData[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    // Fetch projects first
    const { data: projects } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user_id", user.id)

    if (!projects) return []

    const { data: bdpData } = await supabase
        .from("bdp_reports")
        .select("projectId, totalMeters")
        .eq("user_id", user.id)

    // Aggregate
    const ranking = projects.map(project => {
        const projectReports = bdpData?.filter(r => r.projectId === project.id)
        const total = projectReports?.reduce((acc, r) => acc + (Number(r.totalMeters) || 0), 0) || 0

        return {
            name: project.name,
            value: total
        }
    })
        .sort((a, b) => b.value - a.value)
        .slice(0, 5) // Top 5

    return ranking
}
