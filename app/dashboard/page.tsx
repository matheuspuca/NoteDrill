import React from "react"
import { createClient } from "@/lib/supabase/server"
import { getDashboardKPIs, getProductionTrend, getProjectRanking, getBottleneckAnalysis, getSCurveData } from "./analytics-actions"
import { DashboardKPIs, ChartData, SCurveData } from "./analytics-types"
import { DashboardClient } from "./DashboardClient"

// Force dynamic rendering to ensure fresh data on every request
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: { projectId?: string; startDate?: string; endDate?: string }
}) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Acesso negado.</div>

    const projectId = searchParams.projectId === 'all' ? undefined : searchParams.projectId
    const startDate = searchParams.startDate
    const endDate = searchParams.endDate

    // Fetch Active Projects for Filter
    const { data: projectsData } = await supabase
        .from("projects")
        .select("id, name")
        .eq("user_id", user.id)
        .order("name")

    const projects = projectsData || []

    // Parallel data fetching for performance
    let kpis: DashboardKPIs | null = null
    let productionTrend: ChartData[] = []
    let projectRanking: ChartData[] = []
    let bottlenecks: ChartData[] = []
    let sCurveData: SCurveData | null = null
    let diagnosticData: any = null

    try {
        [kpis, productionTrend, projectRanking, bottlenecks, sCurveData] = await Promise.all([
            getDashboardKPIs(projectId, startDate, endDate),
            getProductionTrend(projectId, startDate, endDate),
            getProjectRanking(projectId, startDate, endDate), // If project selected, returns single bar
            getBottleneckAnalysis(projectId, startDate, endDate),
            getSCurveData(projectId)
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
                sCurveData={sCurveData}
            />
        </div>
    )
}
