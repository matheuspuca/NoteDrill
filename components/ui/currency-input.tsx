"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface CurrencyInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
    value: number
    onChange: (value: number) => void
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ className, value, onChange, ...props }, ref) => {
        const [displayValue, setDisplayValue] = React.useState("")

        // Sync internal state with external value prop
        React.useEffect(() => {
            if (value === undefined || value === null) {
                setDisplayValue("R$ 0,00")
                return
            }
            // Format: R$ 1.234,56
            const formatted = new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                minimumFractionDigits: 2,
            }).format(value)
            setDisplayValue(formatted)
        }, [value])

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            // Remove everything that is not a digit
            const rawValue = e.target.value.replace(/\D/g, "")

            // Convert to float (cents)
            const numericValue = Number(rawValue) / 100

            // Update parent
            onChange(numericValue)

            // We don't update displayValue here relies on useEffect or we can optimizations
            // But for React controlled components, ensuring the 'value' prop updates is key.
        }

        return (
            <Input
                {...props}
                ref={ref}
                type="text"
                inputMode="numeric"
                className={cn("font-medium", className)}
                value={displayValue}
                onChange={handleChange}
            />
        )
    }
)
CurrencyInput.displayName = "CurrencyInput"
