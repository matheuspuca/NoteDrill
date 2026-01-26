"use client"

import { Button } from "@/components/ui/button"
import { Printer, Loader2 } from "lucide-react"
import { useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface PlanoReportButtonProps {
    plano: any
    bdps: any[]
}

export function PlanoReportButton({ plano, bdps }: PlanoReportButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false)

    const generatePDF = async () => {
        setIsGenerating(true)

        try {
            const doc = new jsPDF()

            // Header
            doc.setFillColor(248, 250, 252) // slate-50
            doc.rect(0, 0, 210, 40, "F")

            doc.setTextColor(15, 23, 42)
            doc.setFontSize(22)
            doc.setFont("helvetica", "bold")
            doc.text("Relatório de Medição", 14, 15)

            doc.setFontSize(14)
            doc.text(`${plano.name}`, 14, 25)

            doc.setFontSize(10)
            doc.setFont("helvetica", "normal")
            doc.setTextColor(71, 85, 105)
            doc.text(`Obra: ${plano.projects?.name}`, 14, 32)
            doc.text(`Status: ${plano.status}`, 140, 32)

            // Details Table
            const bdpData = bdps.map(b => [
                format(new Date(b.date + 'T12:00:00'), "dd/MM/yyyy"),
                b.equipment?.name || "-",
                b.operator?.name || "-",
                `${Number(b.total_meters || 0).toFixed(1)} m`,
                b.status
            ])

            autoTable(doc, {
                startY: 50,
                head: [["Data", "Perfuratriz", "Operador", "Produção (m)", "Status"]],
                body: bdpData,
                theme: 'striped',
                headStyles: { fillColor: [249, 115, 22], textColor: 255 }, // Orange
                styles: { fontSize: 9 },
                foot: [[
                    "TOTAL",
                    "",
                    "",
                    `${bdps.reduce((acc, b) => acc + (Number(b.total_meters) || 0), 0).toFixed(1)} m`,
                    ""
                ]],
                footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' }
            })

            doc.save(`Medicao_Plano_${plano.name.replace(/\s+/g, '_')}.pdf`)

        } catch (error) {
            console.error("Erro ao gerar PDF:", error)
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <Button
            onClick={generatePDF}
            disabled={isGenerating}
            variant="outline"
            className="rounded-xl gap-2 h-12 px-6 border-slate-200 text-slate-600 hover:bg-slate-50"
        >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
            Gerar Medição
        </Button>
    )
}
