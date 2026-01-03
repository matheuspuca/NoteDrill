
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { BDP } from "@/lib/schemas-bdp"
import { format } from "date-fns"

import { getBase64ImageFromURL } from "@/utils/image-utils"
import { CompanySettingsSchema } from "@/lib/schemas-settings"

export const generateBDPPDF = async (bdp: BDP, companySettings?: CompanySettingsSchema & { logo_url?: string | null } | null) => {
    // Reconstruct services if missing (fetched from DB)
    let servicesToPrint = bdp.services || []
    if (servicesToPrint.length === 0 && bdp.holes && bdp.holes.length > 0) {
        const grouped: Record<string, any> = {}
        bdp.holes.forEach((h: any) => {
            const type = h.serviceType || "Outros"
            if (!grouped[type]) {
                grouped[type] = {
                    serviceType: type,
                    meshLength: h.meshLength,
                    meshWidth: h.meshWidth,
                    diameter: h.diameter,
                    angle: h.angle,
                    azimuth: h.azimuth,
                    holes: []
                }
            }
            grouped[type].holes.push(h)
        })
        servicesToPrint = Object.values(grouped)
    }

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width

    // Helper for sections
    const addSectionTitle = (title: string, y: number) => {
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.setFillColor(240, 240, 240)
        doc.rect(14, y - 4, pageWidth - 28, 6, "F")
        doc.text(title, 16, y)
        return y + 8
    }

    // 0. COMPANY HEADER (Similar to Inventory)
    let currentY = 40
    let headerHeight = 0

    if (companySettings) {
        headerHeight = 40
        // Background Header
        doc.setFillColor(248, 250, 252) // slate-50
        doc.rect(0, 0, pageWidth, 40, "F")

        // Logo
        if (companySettings.logo_url) {
            try {
                // Ensure helper is async/await capable component
                const logoBase64 = await getBase64ImageFromURL(companySettings.logo_url)
                doc.addImage(logoBase64, 'PNG', 14, 5, 30, 30)
            } catch (e) {
                console.error("Erro logo PDF BDP:", e)
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

        const contactParts = []
        if (companySettings.email) contactParts.push(companySettings.email)
        if (companySettings.phone) contactParts.push(companySettings.phone)
        if (contactParts.length > 0) doc.text(contactParts.join(" | "), 50, infoY)

        currentY = 50
    } else {
        // Legacy Title Position
        currentY = 40
    }

    // 1. REPORT TITLE HEADER
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    if (companySettings) {
        doc.text("Boletim Diário de Perfuração (BDP)", 14, currentY)
    } else {
        doc.text("SMARTDRILL - Boletim Diário de Perfuração", pageWidth / 2, 15, { align: "center" })
    }

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    const dateStr = bdp.date ? format(new Date(bdp.date), "dd/MM/yyyy") : "-"

    // Adjust header positions based on company header presence
    const headerDetailsY = companySettings ? currentY + 8 : 25

    doc.text(`Data: ${dateStr}`, 14, headerDetailsY)
    doc.text(`Turno: ${bdp.shift}`, pageWidth - 50, headerDetailsY)
    {/* Fixed Y coordinate to use relative */ }
    doc.text(`Obra: ${bdp.projects?.name || "-"}`, 14, headerDetailsY + 5)
    doc.text(`Operador: ${bdp.operator?.name || "-"}`, pageWidth - 50, headerDetailsY + 5) // Moved Operator to right for balance

    // 2. EQUIPAMENTO & HORÍMETROS
    currentY = headerDetailsY + 15
    currentY = addSectionTitle("EQUIPAMENTO & HORAS", currentY)

    const drillName = bdp.drill?.name || bdp.drillId || "-"
    // Compressor name might need a join if we had it, for now use ID or "-"
    const compressorName = bdp.compressorId || "-"

    autoTable(doc, {
        startY: currentY,
        head: [["Perfuratriz", "Compressor", "Início Ativ.", "Fim Ativ.", "H. Inicial", "H. Final", "Total Horas"]],
        body: [[
            drillName,
            compressorName,
            bdp.startTime || "-",
            bdp.endTime || "-",
            (bdp.hourmeterStart || 0).toString(),
            (bdp.hourmeterEnd || 0).toString(),
            ((bdp.hourmeterEnd || 0) - (bdp.hourmeterStart || 0)).toFixed(1)
        ]],
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
    })

    // 3. EQUIPE (Just Operator and Helper for now as per schema)
    currentY = (doc as any).lastAutoTable.finalY + 10
    currentY = addSectionTitle("EQUIPE DA FRENTE", currentY)

    const teamRows = []
    if (bdp.operator?.name) teamRows.push([bdp.operator.name, "Operador"])
    // Helper is just an ID in schema? Or joined? 
    // Schema says helperId: string. If we don't have the relation loaded, we can't show name.
    // Assuming bdp object might have 'helper' relation if we fetched it, but type doesn't say.
    // Let's check type BDP in schema. It only has projects, operator, drill.
    // So we skip helper name for now or just show ID if present.
    if (bdp.helperId) teamRows.push(["Ajudante (ID: " + bdp.helperId + ")", "Ajudante"])

    if (teamRows.length === 0) teamRows.push(["-", "-"])

    autoTable(doc, {
        startY: currentY,
        head: [["Nome", "Função"]],
        body: teamRows,
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
    })

    // 4. SERVIÇOS EXECUTADOS
    currentY = (doc as any).lastAutoTable.finalY + 10
    currentY = addSectionTitle("SERVIÇOS EXECUTADOS", currentY)

    if (servicesToPrint && servicesToPrint.length > 0) {
        servicesToPrint.forEach((service: any) => {
            // Check page break
            if (currentY > 250) {
                doc.addPage()
                currentY = 20
            }

            // Service Header
            doc.setFontSize(9)
            doc.setFont("helvetica", "bold")
            doc.text(`> ${service.serviceType}`, 16, currentY + 5)

            // Service Params Row
            autoTable(doc, {
                startY: currentY + 7,
                head: [["Malha", "Diâmetro", "Ângulo", "Azimute", "Qtd. Furos"]],
                body: [[
                    `${service.meshLength || 0}x${service.meshWidth || 0}m`,
                    `${service.diameter || 0}mm`,
                    `${service.angle || 0}°`,
                    `${service.azimuth || 0}°`,
                    service.holes?.length || 0
                ]],
                theme: "grid",
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [52, 73, 94] },
                margin: { left: 16 }
            })

            // Holes Table
            const holesData = service.holes?.map((h: any) => [
                h.holeNumber,
                `${h.latitude || '-'} / ${h.longitude || '-'}`,
                `${Number(h.depth).toFixed(1)}m`,
                `${Number(h.subDrilling || 0).toFixed(1)}m`
            ]) || []

            autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 2,
                head: [["#", "Coord (Lat/Long)", "Alt. Perfurada", "Subfuração"]],
                body: holesData,
                theme: "striped",
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [149, 165, 166] },
                margin: { left: 16 }
            })

            currentY = (doc as any).lastAutoTable.finalY + 5
        })
    } else {
        doc.text("Nenhum serviço registrado.", 16, currentY + 10)
        currentY += 15
    }

    // 5. LOCALIZAÇÃO & GEOLOGIA
    // Check page break
    if (currentY > 250) {
        doc.addPage()
        currentY = 20
    }

    currentY = currentY + 10
    currentY = addSectionTitle("LOCALIZAÇÃO & GEOLOGIA", currentY)

    autoTable(doc, {
        startY: currentY,
        head: [["Descrição Material", "Perfil Lit."]],
        body: [[
            bdp.materialDescription || "-",
            bdp.lithologyProfile || "-"
        ]],
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
    })

    // 6. OCORRÊNCIAS & INSUMOS
    currentY = (doc as any).lastAutoTable.finalY + 10
    currentY = addSectionTitle("OCORRÊNCIAS & INSUMOS", currentY)

    // Occurrences string builder
    // occurrences is array of objects { type, timeStart, timeEnd, description }
    const occurrencesList = bdp.occurrences?.map((o: any) =>
        `${o.type} (${o.timeStart}-${o.timeEnd}): ${o.description || ''}`
    ) || []
    const occurrencesText = occurrencesList.length > 0 ? occurrencesList.join("\n") : "Sem ocorrências"

    // Supplies string builder
    // supplies is array of { type, quantity }
    const suppliesList = bdp.supplies?.map((s: any) =>
        `${s.type}: ${s.quantity}`
    ) || []
    const suppliesText = suppliesList.length > 0 ? suppliesList.join(", ") : "Nenhum registrado"

    autoTable(doc, {
        startY: currentY,
        body: [
            ["Ocorrências", occurrencesText],
            ["Insumos", suppliesText]
        ],
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
    })

    // 7. ASSINATURAS
    currentY = (doc as any).lastAutoTable.finalY + 30

    if (currentY > 250) {
        doc.addPage()
        currentY = 40
    }

    const lineLength = 70
    doc.line(20, currentY, 20 + lineLength, currentY) // Left line
    doc.line(pageWidth - 20 - lineLength, currentY, pageWidth - 20, currentY) // Right line

    doc.setFontSize(8)
    doc.text("OPERADOR RESPONSÁVEL", 20 + (lineLength / 2), currentY + 5, { align: "center" })
    doc.text("SUPERVISOR / ENCARREGADO", pageWidth - 20 - (lineLength / 2), currentY + 5, { align: "center" })

    // Save
    doc.save(`BDP_${bdp.projects?.name || 'Projeto'}_${format(new Date(), 'yyyyMMdd')}.pdf`)
}

