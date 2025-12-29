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
}

export interface ChartData {
    name: string
    value: number
}
