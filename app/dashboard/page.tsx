import React from "react"
import { createClient } from "@/lib/supabase/server"
import { getDashboardKPIs, getProductionTrend, getProjectRanking, getBottleneckAnalysis } from "./analytics-actions"
import { DashboardKPIs, ChartData } from "./analytics-types"
import { DashboardClient } from "./DashboardClient"

// Force dynamic rendering to ensure fresh data on every request
export const dynamic = 'force-dynamic'

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: { projectId?: string }
}) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Acesso negado.</div>

    const projectId = searchParams.projectId

    // Fetch Active Projects for Filter
    const { data: projectsData } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user_id", user.id)
        .eq("status", "Em Andamento")
        .order("name")

    const projects = projectsData || []

    // Parallel data fetching for performance
    let kpis: DashboardKPIs | null = null
    let productionTrend: ChartData[] = []
    let projectRanking: ChartData[] = []
    let bottlenecks: ChartData[] = []

    try {
        [kpis, productionTrend, projectRanking, bottlenecks] = await Promise.all([
            getDashboardKPIs(projectId),
            getProductionTrend(projectId),
            getProjectRanking(projectId), // If project selected, returns single bar
            getBottleneckAnalysis(projectId)
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
            topBottleneck: "Erro ao carregar",
            costPerMeter: 0,
            projectViabilityIndex: 0,
            bitPerformance: 0,
            physicalAvailability: 0,
            physicalUtilization: 0,
            dieselPerMeter: 0,
            dieselPerHour: 0
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
                projects={projects}
            />
        </div>
    )
}
