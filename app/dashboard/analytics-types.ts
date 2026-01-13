export interface DashboardKPIs {
    totalProduction: number // Metros
    efficiency: number // m/h
    equipmentUtilization: {
        active: number
        total: number
        percentage: number
    }
    inventoryValuation: number // R$
    activeProjects: number
    dieselConsumption: number // Litros
    downtime: number // Minutos Totais
    topBottleneck: string // Nome do maior gargalo
    costPerMeter: number // R$/m
    projectViabilityIndex: number // 0-100 Score
    bitPerformance: number // Metros / Unidade
    physicalAvailability: number // % DF
    physicalUtilization: number // % UF
    dieselPerMeter?: number // L/m
}

export interface ChartData {
    name: string
    value: number
}
