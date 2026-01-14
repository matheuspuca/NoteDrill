"use client"

import * as React from "react"
import { Warehouse } from "lucide-react"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Equipment } from "@/lib/schemas-equipment"

interface EquipmentSelectorProps {
    equipments: Equipment[]
}

export function EquipmentSelector({ equipments }: EquipmentSelectorProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Get current equipment from URL or undefined
    const selectedEquipmentId = searchParams.get("equipmentId") ?? "all"

    const handleSelect = (equipmentId: string) => {
        const params = new URLSearchParams(searchParams.toString())

        if (equipmentId && equipmentId !== "all") {
            params.set("equipmentId", equipmentId)
        } else {
            params.delete("equipmentId")
        }

        router.replace(`${pathname}?${params.toString()}`)
    }

    return (
        <Select value={selectedEquipmentId} onValueChange={handleSelect}>
            <SelectTrigger className="w-[300px] h-10 bg-white border-slate-200">
                <div className="flex items-center gap-2 truncate">
                    <Warehouse className="h-4 w-4 text-slate-500" />
                    <SelectValue placeholder="Todos os Equipamentos" />
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos os Equipamentos</SelectItem>
                {equipments.map((equipment) => (
                    <SelectItem key={equipment.id} value={equipment.id}>
                        {equipment.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
