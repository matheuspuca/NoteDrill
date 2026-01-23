"use client"

import { Button } from "@/components/ui/button"
import { FileDown, Loader2 } from "lucide-react"
import { useState } from "react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { InventoryItem } from "@/lib/schemas-inventory"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getBase64ImageFromURL } from "@/utils/image-utils"
import { CompanySettingsSchema } from "@/lib/schemas-settings"

interface InventoryReportButtonProps {
    items: InventoryItem[]
    label?: string
    iconOnly?: boolean
    reportTitle?: string
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
    className?: string
    companySettings?: CompanySettingsSchema & { logo_url?: string | null } | null
}

export function InventoryReportButton({
    items,
    label = "Inventário",
    iconOnly = false,
    reportTitle = "Relatório Geral de Inventário",
    variant = "outline",
    className,
    companySettings
}: InventoryReportButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false)

    const generatePDF = async () => {
        setIsGenerating(true)

        try {
            // Group items by Project
            const groupedByProject: Record<string, InventoryItem[]> = {}
            items.forEach(item => {
                const projectName = item.projects?.name || "Sem Obra"
                if (!groupedByProject[projectName]) {
                    groupedByProject[projectName] = []
                }
                groupedByProject[projectName].push(item)
            })

            // Initialize PDF
            const doc = new jsPDF()
            let finalY = 40 // Default start Y without header

            // --- COMPANY HEADER LOGIC ---
            if (companySettings) {
                // Background Header
                doc.setFillColor(248, 250, 252) // slate-50
                doc.rect(0, 0, 210, 40, "F")

                // Logo
                if (companySettings.logo_url) {
                    try {
                        const logoBase64 = await getBase64ImageFromURL(companySettings.logo_url)
                        doc.addImage(logoBase64, 'PNG', 14, 5, 30, 30) // x, y, w, h
                    } catch (e) {
                        console.error("Erro ao carregar logo para PDF:", e)
                    }
                } else {
                    // Placeholder se não tiver logo
                    doc.setFillColor(226, 232, 240)
                    doc.roundedRect(14, 5, 30, 30, 2, 2, "F")
                    doc.setFontSize(8)
                    doc.setTextColor(100)
                    doc.text("Sem Logo", 29, 22, { align: "center" })
                }

                // Company Info
                doc.setTextColor(15, 23, 42) // slate-900
                doc.setFontSize(16)
                doc.setFont("helvetica", "bold")
                doc.text(companySettings.company_name, 50, 12)

                doc.setFontSize(9)
                doc.setFont("helvetica", "normal")
                doc.setTextColor(71, 85, 105) // slate-600

                let infoY = 18
                if (companySettings.cnpj) {
                    doc.text(`CNPJ: ${companySettings.cnpj}`, 50, infoY)
                    infoY += 5
                }
                if (companySettings.address) {
                    doc.text(`${companySettings.address}`, 50, infoY)
                    infoY += 5
                }

                const contactParts = []
                if (companySettings.email) contactParts.push(companySettings.email)
                if (companySettings.phone) contactParts.push(companySettings.phone)

                if (contactParts.length > 0) {
                    doc.text(contactParts.join(" | "), 50, infoY)
                }

                finalY = 50 // Push content down
            }

            // Report Title Area
            doc.setTextColor(0, 0, 0)
            doc.setFontSize(18)
            doc.setFont("helvetica", "bold")
            doc.text(reportTitle, 14, finalY)

            doc.setFontSize(10)
            doc.setFont("helvetica", "normal")
            doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, 14, finalY + 8)

            if (!companySettings) {
                doc.text("NoteDrill - Sistema de Gestão", 14, finalY + 13)
            }

            finalY += 20
            let grandTotal = 0

            // Iterate Projects
            Object.entries(groupedByProject).forEach(([projectName, projectItems]) => {
                // Project Header
                doc.setFontSize(14)
                doc.setTextColor(0, 0, 0)
                doc.text(`Obra: ${projectName}`, 14, finalY + 10)

                // Group items by Type within Project
                const itemsByType = projectItems.reduce((acc, item) => {
                    const type = item.type || "Material"
                    if (!acc[type]) acc[type] = []
                    acc[type].push(item)
                    return acc
                }, {} as Record<string, InventoryItem[]>)

                const sortedTypes = Object.keys(itemsByType).sort()

                sortedTypes.forEach(type => {
                    const typeItems = itemsByType[type]

                    // Type Sub-header
                    // Check if we need a new page
                    if (finalY > 250) {
                        doc.addPage()
                        finalY = 20
                    }

                    doc.setFontSize(10)
                    doc.setTextColor(100, 116, 139) // Slate-500
                    doc.setFont("helvetica", "bold")
                    doc.text(`> ${type}`, 14, finalY + 5)

                    const typeTableData = typeItems.map(item => [
                        item.name,
                        item.brand || "-",
                        `${item.quantity} ${item.unit}`,
                        `R$ ${Number(item.value || 0).toFixed(2)}`,
                        `R$ ${(Number(item.quantity || 0) * Number(item.value || 0)).toFixed(2)}`
                    ])

                    autoTable(doc, {
                        startY: finalY + 7,
                        head: [["Item", "Marca/Detalhes", "Qtd.", "Valor Unit.", "Total"]],
                        body: typeTableData,
                        theme: 'striped',
                        headStyles: {
                            fillColor: type === "EPI" ? [249, 115, 22] : (type === "Material" ? [59, 130, 246] : [71, 85, 105]), // Orange for EPI, Blue for Material, Slate default
                            textColor: 255,
                            fontSize: 9,
                            fontStyle: 'bold'
                        },
                        styles: { fontSize: 8, cellPadding: 3 },
                        margin: { left: 14, right: 14 },
                    })

                    // @ts-ignore
                    finalY = doc.lastAutoTable.finalY + 5
                })

                // Project Subtotal Footer
                const projectTotal = projectItems.reduce((acc, item) => acc + (Number(item.quantity || 0) * Number(item.value || 0)), 0)
                grandTotal += projectTotal

                autoTable(doc, {
                    startY: finalY,
                    body: [["Total da Obra:", "", "", "", `R$ ${projectTotal.toFixed(2)}`]],
                    theme: 'plain',
                    styles: { fontStyle: 'bold', fontSize: 10, cellPadding: 2 },
                    columnStyles: { 4: { halign: 'right' } }, // Right align total
                    margin: { left: 14, right: 14 }
                })

                // @ts-ignore
                finalY = doc.lastAutoTable.finalY + 10
            })

            // Grand Total
            doc.setFontSize(12)
            doc.setTextColor(0, 0, 0)
            doc.text(`VALOR TOTAL: R$ ${grandTotal.toFixed(2)}`, 14, finalY + 10)

            // Save
            doc.save(`Inventario_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`)

        } catch (error) {
            console.error("Erro ao gerar PDF:", error)
            alert("Erro ao gerar relatório PDF.")
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <Button
            onClick={generatePDF}
            disabled={isGenerating}
            variant={variant}
            className={className || "h-14 px-6 border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-lg rounded-2xl gap-2 shadow-sm"}
        >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
            {!iconOnly && label}
        </Button>
    )
}
