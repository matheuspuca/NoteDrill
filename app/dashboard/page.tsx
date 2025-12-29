import React from "react"
import { getDashboardKPIs, getProductionTrend, getProjectRanking, getBottleneckAnalysis } from "./analytics-actions"
import { DashboardKPIs, ChartData } from "./analytics-types"
import { DashboardClient } from "./DashboardClient"

// Force dynamic rendering to ensure fresh data on every request
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
    // Parallel data fetching for performance
    let kpis: DashboardKPIs | null = null
    let productionTrend: ChartData[] = []
    let projectRanking: ChartData[] = []
    let bottlenecks: ChartData[] = []

    try {
        [kpis, productionTrend, projectRanking, bottlenecks] = await Promise.all([
            getDashboardKPIs(),
            getProductionTrend(),
            getProjectRanking(),
            getBottleneckAnalysis()
        ])
    } catch (error) {
        console.error("Dashboard Data Fetch Error:", error)
        // Fallback data to prevent crash
        kpis = {
            totalProduction: 0,
            efficiency: 0,
            equipmentUtilization: { active: 0, total: 0, percentage: 0 },
            inventoryValuation: 0,
            activeProjects: 0,
            dieselConsumption: 0,
            downtime: 0,
            topBottleneck: "Erro ao carregar"
        }
        productionTrend = []
        projectRanking = []
        bottlenecks = []
    }

    return (
        <div className="max-w-[1800px] mx-auto pb-10">
            <DashboardClient
                kpis={kpis!}
                productionTrend={productionTrend}
                projectRanking={projectRanking}
                bottlenecks={bottlenecks}
            />
        </div>
    )
}
