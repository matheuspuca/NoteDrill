
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { BDP } from "@/lib/schemas-bdp"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { getBase64ImageFromURL } from "@/utils/image-utils"
import { CompanySettingsSchema } from "@/lib/schemas-settings"

export const generateMeasurementPDF = async (
    reports: BDP[],
    projectName: string,
    companySettings?: CompanySettingsSchema & { logo_url?: string | null } | null,
    dateRange?: { start?: string, end?: string }
) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width

    // 0. COMPANY HEADER
    let currentY = 40
    let headerHeight = 0

    if (companySettings) {
        headerHeight = 40
        doc.setFillColor(248, 250, 252)
        doc.rect(0, 0, pageWidth, 40, "F")

        if (companySettings.logo_url) {
            try {
                const logoBase64 = await getBase64ImageFromURL(companySettings.logo_url)
                doc.addImage(logoBase64, 'PNG', 14, 5, 30, 30)
            } catch (e) {
                console.error("Erro logo PDF:", e)
            }
        } else {
            doc.setFillColor(226, 232, 240)
            doc.roundedRect(14, 5, 30, 30, 2, 2, "F")
            doc.setFontSize(8)
            doc.setTextColor(100)
            doc.text("Sem Logo", 29, 22, { align: "center" })
        }

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
    }

    // 1. REPORT TITLE & CONTEXT
    const titleY = companySettings ? currentY : 20

    doc.setTextColor(0)
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("Relatório de Medição de Obra", 14, titleY)

    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(100)
    doc.text(`Obra: ${projectName}`, 14, titleY + 7)

    const today = format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })
    doc.setFontSize(9)
    doc.text(`Gerado em: ${today}`, pageWidth - 14, titleY, { align: "right" })

    // Date Range Info
    let filterText = "Período: Completo / Todos os registros"
    if (dateRange?.start || dateRange?.end) {
        const s = dateRange.start ? format(new Date(dateRange.start), "dd/MM/yyyy") : "Início"
        const e = dateRange.end ? format(new Date(dateRange.end), "dd/MM/yyyy") : "Hoje"
        filterText = `Período: ${s} até ${e}`
    }

    doc.text(filterText, 14, titleY + 14)

    // 2. METRICS SUMMARY
    currentY = titleY + 25

    // Calculations
    const totalMeters = reports.reduce((acc, r) => acc + (Number(r.totalMeters) || 0), 0)
    const totalHours = reports.reduce((acc, r) => acc + (Number(r.totalHours) || 0), 0)
    const uniqueDrills = new Set(reports.map(r => r.drillId)).size
    const activeOperators = new Set(reports.map(r => r.operatorId)).size
    const productionAvg = totalHours > 0 ? (totalMeters / totalHours).toFixed(1) : "0.0"

    // Summary Card Style
    doc.setFillColor(241, 245, 249)
    doc.roundedRect(14, currentY, pageWidth - 28, 25, 3, 3, "F")

    doc.setTextColor(51, 65, 85)
    doc.setFontSize(10)

    const colWidth = (pageWidth - 28) / 4
    const startX = 14

    // Column 1: Total Meters
    doc.text("Total Perfurado", startX + 10, currentY + 8)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(37, 99, 235) // Blue
    doc.text(`${totalMeters.toFixed(1)} m`, startX + 10, currentY + 18)

    // Column 2: Total Hours
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(51, 65, 85)
    doc.text("Horas Totais", startX + colWidth + 10, currentY + 8)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text(`${totalHours.toFixed(1)} h`, startX + colWidth + 10, currentY + 18)

    // Column 3: Avg Production
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(51, 65, 85)
    doc.text("Média (m/h)", startX + (colWidth * 2) + 10, currentY + 8)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text(`${productionAvg}`, startX + (colWidth * 2) + 10, currentY + 18)

    // Column 4: Resources
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(51, 65, 85)
    doc.text("Recursos", startX + (colWidth * 3) + 10, currentY + 8)
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text(`${uniqueDrills} Equip. | ${activeOperators} Op.`, startX + (colWidth * 3) + 10, currentY + 18)


    // 3. DETAILED TABLE
    currentY = currentY + 35

    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text("Detalhamento dos Boletins", 14, currentY - 5)

    const tableBody = reports
        .sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime())
        .map(r => [
            format(new Date(r.date + 'T12:00:00'), "dd/MM/yyyy"),
            `#${r.reportNumber}`,
            r.drill?.name || r.drillId || "-",
            r.operator?.name || "-",
            r.shift || "-",
            `${Number(r.totalMeters).toFixed(1)} m`
        ])

    autoTable(doc, {
        startY: currentY,
        head: [["Data", "Nº", "Equipamento", "Operador", "Turno", "Produção"]],
        body: tableBody,
        theme: "striped",
        headStyles: { fillColor: [30, 41, 59] }, // slate-800
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
            5: { halign: 'right', fontStyle: 'bold' }
        }
    })

    // 4. SIGNATURES
    currentY = (doc as any).lastAutoTable.finalY + 40
    if (currentY > 250) {
        doc.addPage()
        currentY = 50
    }

    const lineLength = 70
    doc.setDrawColor(200)
    doc.line(20, currentY, 20 + lineLength, currentY)
    doc.line(pageWidth - 20 - lineLength, currentY, pageWidth - 20, currentY)

    doc.setFontSize(8)
    doc.setTextColor(100)
    doc.text("RESPONSÁVEL TÉCNICO", 20 + (lineLength / 2), currentY + 5, { align: "center" })
    doc.text("CLIENTE / FISCALIZAÇÃO", pageWidth - 20 - (lineLength / 2), currentY + 5, { align: "center" })

    // Save
    const safeName = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
    doc.save(`Medicao_${safeName}_${format(new Date(), 'yyyyMMdd')}.pdf`)
}
