"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { addDays, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export function DateRangePicker({
    className,
}: React.HTMLAttributes<HTMLDivElement>) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Initialize state from URL params
    const initialDate: DateRange | undefined = React.useMemo(() => {
        const start = searchParams.get("startDate")
        const end = searchParams.get("endDate")
        if (start && end) {
            return {
                from: new Date(start),
                to: new Date(end),
            }
        }
        return undefined
    }, [searchParams])

    const [date, setDate] = React.useState<DateRange | undefined>(initialDate)

    // Update URL when date changes and (importantly) when the popover is closed or user confirms.
    // For better UX with ranges, we usually update on selection or have an "Apply" button.
    // Here, we'll try to update automatically but debounce or wait for valid range.

    const handleSelect = (range: DateRange | undefined) => {
        setDate(range)

        if (range?.from && range?.to) {
            const params = new URLSearchParams(searchParams.toString())
            params.set("startDate", format(range.from, "yyyy-MM-dd"))
            params.set("endDate", format(range.to, "yyyy-MM-dd"))
            router.replace(`${pathname}?${params.toString()}`)
        } else if (!range) {
            // Clear filter
            const params = new URLSearchParams(searchParams.toString())
            params.delete("startDate")
            params.delete("endDate")
            router.replace(`${pathname}?${params.toString()}`)
        }
    }

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-full sm:w-[300px] justify-start text-left font-normal bg-white border-slate-200 h-10 rounded-md",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                                    {format(date.to, "dd/MM/yyyy", { locale: ptBR })}
                                </>
                            ) : (
                                format(date.from, "dd/MM/yyyy", { locale: ptBR })
                            )
                        ) : (
                            <span>Filtrar por data</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={handleSelect}
                        numberOfMonths={2}
                        locale={ptBR}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
