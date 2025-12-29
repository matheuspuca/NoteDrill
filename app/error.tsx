"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-slate-50 text-slate-800">
            <h2 className="text-2xl font-bold">Algo deu errado!</h2>
            <p className="text-slate-500">{error.message || "Ocorreu um erro inesperado."}</p>
            <Button
                onClick={() => reset()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
            >
                Tentar novamente
            </Button>
        </div>
    )
}
