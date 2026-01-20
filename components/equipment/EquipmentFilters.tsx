"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import Link from 'next/link'
import { Plus } from 'lucide-react'

interface ProjectOption {
    id: string
    name: string
}

interface EquipmentOption {
    id: string
    name: string
    // other fields if needed by EquipmentSelector
    status?: string
    brand?: string | null
    model?: string | null
    year?: number | null
    hour_meter?: number | null
}

interface EquipmentFiltersProps {
    projects: ProjectOption[]
    equipments: EquipmentOption[]
}

export function EquipmentFilters({ equipments }: { equipments: EquipmentOption[] }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const selectedEquipmentId = searchParams.get('equipmentId')

    const handleEquipmentChange = (value: string | null) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value) {
            params.set('equipmentId', value)
        } else {
            params.delete('equipmentId')
        }
        router.replace(`/dashboard/equipments?${params.toString()}`)
        router.refresh()
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                {/* Left Side: Dates */}
                <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto items-start md:items-center">
                    {/* Date Inputs */}
                    <div className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-500 ml-1 mb-1">Data Inicial</span>
                                <input
                                    type="date"
                                    className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full sm:w-auto shadow-sm"
                                    value={searchParams.get("startDate") || ""}
                                    onChange={(e) => {
                                        const params = new URLSearchParams(searchParams.toString())
                                        if (e.target.value) params.set("startDate", e.target.value)
                                        else params.delete("startDate")
                                        router.replace(`/dashboard/equipments?${params.toString()}`)
                                        router.refresh()
                                    }}
                                />
                            </div>
                            <span className="text-slate-300 font-bold mt-6">-</span>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-500 ml-1 mb-1">Data Final</span>
                                <input
                                    type="date"
                                    className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full sm:w-auto shadow-sm"
                                    value={searchParams.get("endDate") || ""}
                                    onChange={(e) => {
                                        const params = new URLSearchParams(searchParams.toString())
                                        if (e.target.value) params.set("endDate", e.target.value)
                                        else params.delete("endDate")
                                        router.replace(`/dashboard/equipments?${params.toString()}`)
                                        router.refresh()
                                    }}
                                />
                            </div>
                        </div>

                        {(searchParams.get("startDate") || searchParams.get("endDate")) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    const params = new URLSearchParams(searchParams.toString())
                                    params.delete("startDate")
                                    params.delete("endDate")
                                    router.replace(`/dashboard/equipments?${params.toString()}`)
                                    router.refresh()
                                }}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 text-xs font-bold mt-6 h-9 px-3 rounded-lg"
                            >
                                Limpar
                            </Button>
                        )}
                    </div>
                </div>

                <Link href="/dashboard/equipments/new" className="w-full xl:w-auto mt-4 xl:mt-0">
                    <Button className="w-full xl:w-auto bg-[#2563EB] hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 rounded-xl h-11 px-6 font-bold transition-all hover:scale-105 active:scale-100">
                        <Plus className="mr-2 h-4 w-4" /> Novo Equipamento
                    </Button>
                </Link>
            </div>

            {/* Equipment Filters - Button Row */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center animate-in slide-in-from-top-2 duration-500 delay-100">
                <span className="text-sm font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">Filtrar por Equipamento:</span>
                <div className="flex gap-2 flex-wrap overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                    <Button
                        variant={!selectedEquipmentId ? "default" : "outline"}
                        className={!selectedEquipmentId ? "bg-slate-800 text-white font-bold shadow-md hover:bg-slate-700" : "bg-white text-slate-500 border-slate-200 font-bold hover:bg-slate-50 hover:text-slate-700"}
                        onClick={() => handleEquipmentChange(null)}
                        size="sm"
                    >
                        Todos
                    </Button>
                    {equipments.map((e) => {
                        const isSelected = selectedEquipmentId === e.id
                        return (
                            <Button
                                key={e.id}
                                variant={isSelected ? "default" : "outline"}
                                className={isSelected ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700" : "bg-white text-slate-500 border-slate-200 font-bold hover:bg-slate-50 hover:text-slate-700"}
                                onClick={() => handleEquipmentChange(e.id)}
                                size="sm"
                            >
                                {e.name}
                            </Button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
