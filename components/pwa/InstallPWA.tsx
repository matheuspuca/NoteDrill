"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setIsVisible(true)
        }

        window.addEventListener("beforeinstallprompt", handler)

        return () => window.removeEventListener("beforeinstallprompt", handler)
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()

        const { outcome } = await deferredPrompt.userChoice

        if (outcome === "accepted") {
            setDeferredPrompt(null)
            setIsVisible(false)
        }
    }

    if (!isVisible) return null

    return (
        <Button
            onClick={handleInstall}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100"
        >
            <Download className="h-4 w-4" />
            Instalar App
        </Button>
    )
}
