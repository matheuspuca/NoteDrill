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
        if (diff < 0) diff += 24 * 60 // Handle midnight crossing

        return diff // minutes
    } catch (e) {
        console.error("Error calculating duration:", e)
        return 0
    }
}

export async function getDashboardKPIs(projectId?: string): Promise<DashboardKPIs> {
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
        projectViabilityIndex: 0,
        bitPerformance: 0,
        physicalAvailability: 0,
        physicalUtilization: 0,
        dieselPerMeter: 0,
        dieselPerHour: 0
    }

    const today = new Date()
    const startMonth = startOfMonth(today).toISOString()
    const endMonth = endOfMonth(today).toISOString()

    // 1. Fetch BDPs for Current Month (Production, Efficiency, Diesel, DF/UF)
    let query = supabase
    // 1. Fetch BDPs for Current Month
    let query = supabase
        .from("bdp_reports")
        .select("totalMeters:total_meters, totalHours:total_hours, supplies, occurrences, startTime:start_time, endTime:end_time, projectId:project_id")
        .eq("user_id", user.id)
        .gte("date", startMonth)
        .lte("date", endMonth)

    if (projectId) {
        query = query.eq("project_id", projectId)
    }

    const { data: monthlyBdps } = await query

    const totalProduction = monthlyBdps?.reduce((acc, curr) => acc + (Number(curr.totalMeters) || 0), 0) || 0
    // Efficiency Formula: (Drilling Hours / (Shift Hours - Scheduled Stops)) * 100
    // We need to calculate Scheduled Stops first.
    // For now we initialize efficiency as 0 and calculate it after processing occurrences.
    let efficiency = 0

    // Calculate Downtime & Bottlenecks & DF/UF
    const bottleneckMap: Record<string, number> = {}
    let totalDowntime = 0
    let totalScheduledTime = 0
    let totalMaintenanceDowntime = 0
    let totalOperationalDowntime = 0

    monthlyBdps?.forEach(report => {
        // Scheduled Time Calculation
        let dailyScheduled = 0
        if (report.startTime && report.endTime) {
            dailyScheduled = calculateDuration(report.startTime, report.endTime)
        } else {
            dailyScheduled = 0
        }

        if (dailyScheduled > 0) {
            totalScheduledTime += dailyScheduled

            const occurrences = report.occurrences as any[] | null
            if (occurrences && Array.isArray(occurrences)) {
                occurrences.forEach((occ: any) => {
                    const duration = calculateDuration(occ.timeStart, occ.timeEnd)
                    if (duration > 0) {
                        totalDowntime += duration
                        bottleneckMap[occ.type] = (bottleneckMap[occ.type] || 0) + duration

                        // Categorize
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

    // Calculate Efficiency
    // Formula: (Drilling Hours / (Shift Hours - Scheduled Stops)) * 100

    // 1. Identify Scheduled Stops
    // In 'occurrences', we need to check for "Refeição", "DDS", "Troca de Turno" etc.
    // Based on 'occurrenceTypeSchema': "Lanche/almoço/jantar", "DDS", "Marcação topográfica"(maybe?), "Detonação"(maybe?)
    // Let's explicitly look for keys.
    const scheduledTypes = ["Lanche/almoço/jantar", "DDS", "Detonação", "Troca de turno", "Abastecimento diesel", "Abastecimento água"]

    // Re-iterate occurrences to sum scheduled stops specifically
    let totalScheduledStops = 0

    monthlyBdps?.forEach(report => {
        const occurrences = report.occurrences as any[] | null
        if (occurrences && Array.isArray(occurrences)) {
            occurrences.forEach((occ: any) => {
                const duration = calculateDuration(occ.timeStart, occ.timeEnd)
                if (scheduledTypes.includes(occ.type)) {
                    totalScheduledStops += duration
                }
            })
        }
    })

    const totalDrillingTime = Math.max(0, totalScheduledTime - totalDowntime) // Actual drilling time
    const netAvailableTime = Math.max(1, totalScheduledTime - totalScheduledStops) // Shift - Scheduled

    efficiency = (totalDrillingTime / netAvailableTime) * 100

    // DF = (Scheduled - Maintenance) / Scheduled
    // UF = (Available - OperationalStops) / Available

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
    // Calculate Diesel Consumption
    const dieselConsumption = monthlyBdps?.reduce((acc, report) => {
        const supplies = report.supplies as any[] | null
        if (!supplies || !Array.isArray(supplies)) return acc

        const reportDiesel = supplies
            .filter((s: any) => s.type && s.type.toLowerCase().includes("diesel"))
            .reduce((sum: number, s: any) => sum + (Number(s.quantity) || 0), 0)

        return acc + reportDiesel
    }, 0) || 0

    // Diesel per Meter (L/m)
    const dieselPerMeter = totalProduction > 0 ? (dieselConsumption / totalProduction) : 0

    // Diesel per Hour (L/h)
    const totalDrillingHours = Math.max(1, (totalScheduledTime - totalDowntime) / 60) // Hours
    // Note: Efficiency formula below uses drillingHours in minutes usually, let's keep consistency.

    // 2. Fetch Equipment for Utilization
    let equipQuery = supabase
        .from("equipment")
        .select("status, ownership_type, rental_cost_monthly, depreciation_cost_monthly")
        .eq("user_id", user.id)

    // Note: Equipment isn't strictly tied to project in DB schema yet usually, 
    // but if we had location, we would filter. For now, we assume global float if projectId is selected
    // OR we filter by 'current_project_id' if that column existed.
    // Let's assume global fleet for now unless schema supports it.

    const { data: equipments } = await equipQuery

    // ... (rest of equipment logic)

    const totalEquipments = equipments?.length || 0
    const activeEquipments = equipments?.filter(e => e.status === "Operacional").length || 0
    const utilPercentage = totalEquipments > 0 ? Math.round((activeEquipments / totalEquipments) * 100) : 0

    // 3. Fetch Inventory (Items + EPIs) for Valuation
    let inventoryQuery = supabase.from("inventory_items").select("quantity, value, projectId").eq("user_id", user.id)
    let epiQuery = supabase.from("inventory_epis").select("quantity, value, projectId").eq("user_id", user.id)

    if (projectId) {
        inventoryQuery = inventoryQuery.eq("project_id", projectId)
        epiQuery = epiQuery.eq("project_id", projectId)
    }

    const { data: inventory } = await inventoryQuery
    const { data: epis } = await epiQuery

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
        .eq("status", "Em Andamento")

    // 5. Cost per Meter Calculation (Updated v2.2)
    const avgDieselPrice = 6.50
    const fuelCost = dieselConsumption * avgDieselPrice

    const laborCost = 15000 // Estimativa mensal fixa por enquanto

    // C. Depreciação / Aluguel (Equipamentos)
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
    const efficiencyScore = Math.min(efficiency / 40, 1) * 50 // Max 50 pts
    const downtimePercentage = totalHours > 0 ? (totalDowntime / 60) / totalHours : 0
    const downtimeScore = Math.max(0, 1 - (downtimePercentage / 0.20)) * 50 // Max 50 pts
    const projectViabilityIndex = Math.round(efficiencyScore + downtimeScore)

    // 7. Bit Performance (Metros / Unidade)
    // Formula: Sum(Meters Drilled by Equipment X) / Count(Stock Out "Bit" for Equipment X)

    let bitPerformance = 0
    try {
        // Fetch Stock Outs from inventory_transactions
        let transQuery = supabase
            .from('inventory_transactions')
            .select('quantity, item:inventory_items!inner(name), projectId')
            .eq('user_id', user.id)
            .eq('type', 'OUT')
            .ilike('item.name', '%Bit%')

        if (projectId) {
            transQuery = transQuery.eq('project_id', projectId)
        }

        const { data: bitTransactions } = await transQuery

        const totalBitsConsumed = bitTransactions?.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0) || 0

        if (totalBitsConsumed > 0) {
            bitPerformance = totalProduction / totalBitsConsumed
        }
    } catch (e) {
        console.warn("Bit Performance calc failed:", e)
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
        inventoryValuation,
        activeProjects: projectCount || 0,
        dieselConsumption: Math.round(dieselConsumption),
        dieselPerMeter: Math.round(dieselPerMeter * 100) / 100,
        dieselPerHour: Math.round((dieselConsumption / totalDrillingHours) * 100) / 100,
        downtime: totalDowntime,
        topBottleneck,
        costPerMeter: Math.round(costPerMeter * 100) / 100,
        projectViabilityIndex,
        bitPerformance: Math.round(bitPerformance * 10) / 10,
        physicalAvailability: Math.round(df * 10) / 10, // DF %
        physicalUtilization: Math.round(uf * 10) / 10   // UF %
    }
}

export async function getBottleneckAnalysis(projectId?: string): Promise<ChartData[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const endDate = new Date()
    const startDate = subDays(endDate, 30)

    let query = supabase
        .from("bdp_reports")
        .select("occurrences")
        .eq("user_id", user.id)
        .gte("date", startDate.toISOString())
        .lte("date", endDate.toISOString())

    if (projectId) {
        query = query.eq("project_id", projectId)
    }

    const { data: reports } = await query

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

export async function getProductionTrend(projectId?: string): Promise<ChartData[]> {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const endDate = new Date()
    const startDate = subDays(endDate, 30) // Last 30 days

    // Fetch reports
    let query = supabase
        .from("bdp_reports")
        .select("date, totalMeters:total_meters")
        .eq("user_id", user.id)
        .gte("date", startDate.toISOString())
        .lte("date", endDate.toISOString())
        .order("date", { ascending: true })

    if (projectId) {
        query = query.eq("project_id", projectId)
    }

    const { data: reports } = await query

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

export async function getProjectRanking(projectId?: string): Promise<ChartData[]> {
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
        .select("projectId:project_id, totalMeters:total_meters")
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
