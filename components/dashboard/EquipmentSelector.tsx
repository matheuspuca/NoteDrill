"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Warehouse } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Equipment } from "@/lib/schemas-equipment"

interface EquipmentSelectorProps {
    equipments: Equipment[]
}

export function EquipmentSelector({ equipments }: EquipmentSelectorProps) {
    const [open, setOpen] = React.useState(false)
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Get current equipment from URL or undefined
    const selectedEquipmentId = searchParams.get("equipmentId")

    const handleSelect = (equipmentId: string | null) => {
        const params = new URLSearchParams(searchParams.toString())

        if (equipmentId && equipmentId !== "all") {
            params.set("equipmentId", equipmentId)
        } else {
            params.delete("equipmentId")
        }

        router.replace(`${pathname}?${params.toString()}`)
        setOpen(false)
    }

    const selectedEquipment = equipments.find((eq) => eq.id === selectedEquipmentId)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[300px] justify-between h-10 bg-white border-slate-200"
                >
                    <div className="flex items-center gap-2 truncate">
                        <Warehouse className="h-4 w-4 text-slate-500" />
                        {selectedEquipmentId ? (
                            selectedEquipment ? selectedEquipment.name : "Equipamento não encontrado"
                        ) : (
                            "Todos os Equipamentos"
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Buscar equipamento..." />
                    <CommandList>
                        <CommandEmpty>Nenhum equipamento encontrado.</CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value="all_equipments_option"
                                onSelect={() => handleSelect(null)}
                                className="cursor-pointer font-medium"
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        !selectedEquipmentId ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                Todos os Equipamentos
                            </CommandItem>
                            {equipments.map((equipment) => (
                                <CommandItem
                                    key={equipment.id}
                                    value={equipment.name}
                                    onSelect={() => handleSelect(equipment.id)}
                                    className="cursor-pointer"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedEquipmentId === equipment.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {equipment.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
