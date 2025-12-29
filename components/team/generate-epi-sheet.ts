
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface EPIUsage {
    id: string
    date: string
    quantity: number
    inventory_epis: {
        name: string
        ca: string
        unit: string
    } | {
        name: string
        ca: string
        unit: string
    }[]
}

import { getBase64ImageFromURL } from "@/utils/image-utils"
import { CompanySettingsSchema } from "@/lib/schemas-settings"

export const generateEPISheet = async (memberName: string, role: string, history: EPIUsage[], companySettings?: CompanySettingsSchema & { logo_url?: string | null } | null) => {
    const doc = new jsPDF()

    // 0. COMPANY HEADER
    let currentY = 40
    const pageWidth = doc.internal.pageSize.width

    if (companySettings) {
        // Background Header
        doc.setFillColor(248, 250, 252) // slate-50
        doc.rect(0, 0, pageWidth, 40, "F")

        // Logo
        if (companySettings.logo_url) {
            try {
                const logoBase64 = await getBase64ImageFromURL(companySettings.logo_url)
                doc.addImage(logoBase64, 'PNG', 14, 5, 30, 30)
            } catch (e) {
                console.error("Erro logo PDF EPI:", e)
            }
        } else {
            // Placeholder
            doc.setFillColor(226, 232, 240)
            doc.roundedRect(14, 5, 30, 30, 2, 2, "F")
            doc.setFontSize(8)
            doc.setTextColor(100)
            doc.text("Sem Logo", 29, 22, { align: "center" })
        }

        // Company Info
        doc.setTextColor(15, 23, 42)
        doc.setFontSize(16)
        doc.setFont("helvetica", "bold")
        doc.text(companySettings.company_name, 50, 12)

        doc.setFontSize(9)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(71, 85, 105)

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
        if (contactParts.length > 0) doc.text(contactParts.join(" | "), 50, infoY)

        currentY = 55
    } else {
        // Fallback Header
        doc.setFontSize(12)
        doc.setTextColor(40)
        doc.text("EMPRESA: SMART DRILL SERVIÇOS DE PERFURAÇÃO", 14, 30)
        currentY = 45
    }

    // Header Title
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(40)
    doc.text("FICHA DE CONTROLE DE EPI", pageWidth / 2, currentY, { align: "center" })

    currentY += 15

    // Employee Info Box
    doc.setDrawColor(200, 200, 200)
    doc.setFillColor(250, 250, 250)
    doc.rect(14, currentY, 182, 25, "FD")

    doc.setFontSize(10)
    doc.setFont("helvetica", "bold")
    doc.text("FUNCIONÁRIO:", 16, currentY + 8)
    doc.setFont("helvetica", "normal")
    doc.text(memberName.toUpperCase(), 50, currentY + 8)

    doc.setFont("helvetica", "bold")
    doc.text("FUNÇÃO:", 16, currentY + 18)
    doc.setFont("helvetica", "normal")
    doc.text(role.toUpperCase(), 50, currentY + 18)

    doc.setFont("helvetica", "bold")
    doc.text("DATA:", 130, currentY + 8)
    doc.setFont("helvetica", "normal")
    doc.text(format(new Date(), "dd/MM/yyyy"), 145, currentY + 8)

    currentY += 35

    // Declaration Text
    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(
        "Declaro ter recebido os EPIs listados abaixo em perfeitas condições de uso e me comprometo a utilizá-los " +
        "conforme as normas de segurança da empresa. Declaro também estar ciente da obrigatoriedade do uso.",
        14, currentY, { maxWidth: 180 }
    )

    currentY += 15

    // Table
    const tableData = history.map(item => {
        const epi = Array.isArray(item.inventory_epis) ? item.inventory_epis[0] : item.inventory_epis
        return [
            format(new Date(item.date), "dd/MM/yyyy"),
            epi?.name || "N/A",
            epi?.ca || "-",
            `${item.quantity} ${epi?.unit || "un"}`,
            "", // Signature placeholder
        ]
    })

    autoTable(doc, {
        startY: currentY,
        head: [["DATA", "DESCRIÇÃO DO EPI", "C.A.", "QTD", "ASSINATURA DO FUNCIONÁRIO"]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: "bold" },
        columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 60 },
            2: { cellWidth: 25 },
            3: { cellWidth: 20 },
            4: { cellWidth: 50 }, // Wider for signature
        },
        didDrawCell: (data) => {
            // Add a line for signature in the last column
            if (data.section === 'body' && data.column.index === 4) {
                // doc.line(data.cell.x + 2, data.cell.y + data.cell.height - 2, data.cell.x + data.cell.width - 2, data.cell.y + data.cell.height - 2)
            }
        }
    })

    // Footer Signature
    const finalY = (doc as any).lastAutoTable.finalY + 40

    doc.line(60, finalY, 150, finalY)
    doc.setFontSize(8)
    doc.text("ASSINATURA DO RESPONSÁVEL PELA ENTREGA", 105, finalY + 5, { align: "center" })

    doc.save(`Ficha_EPI_${memberName.replace(/\s+/g, '_')}.pdf`)
}
