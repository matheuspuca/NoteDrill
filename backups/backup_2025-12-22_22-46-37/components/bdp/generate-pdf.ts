
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { BDP } from "@/lib/schemas-bdp"
import { format } from "date-fns"

export const generateBDPPDF = (bdp: BDP) => {
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

    // 1. HEADER
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("SMARTDRILL - Boletim Diário de Perfuração", pageWidth / 2, 15, { align: "center" })

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(`Data: ${format(new Date(bdp.date), "dd/MM/yyyy")}`, 14, 25)
    doc.text(`Turno: ${bdp.shift}`, pageWidth - 50, 25)
    doc.text(`Obra: ${bdp.projectName}`, 14, 30)
    doc.text(`Operador: ${bdp.operatorName}`, pageWidth / 2, 30, { align: "center" })

    // 2. EQUIPAMENTO & HORÍMETROS
    let currentY = 40
    currentY = addSectionTitle("EQUIPAMENTO & HORAS", currentY)

    autoTable(doc, {
        startY: currentY,
        head: [["Perfuratriz", "Compressor", "Início Ativ.", "Fim Ativ.", "H. Inicial", "H. Final", "Total Horas"]],
        body: [[
            bdp.drillId,
            bdp.compressorId || "-",
            bdp.activityStart,
            bdp.activityEnd,
            bdp.hourmeterStart.toString(),
            bdp.hourmeterEnd.toString(),
            (bdp.hourmeterEnd - bdp.hourmeterStart).toFixed(1)
        ]],
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
    })

    // 3. EQUIPE
    currentY = (doc as any).lastAutoTable.finalY + 10
    currentY = addSectionTitle("EQUIPE DA FRENTE", currentY)

    const teamRows = bdp.team.map(t => [t.name, t.function])
    autoTable(doc, {
        startY: currentY,
        head: [["Nome", "Função"]],
        body: teamRows,
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
    })

    // 4. PERFURAÇÃO & SERVIÇOS
    currentY = (doc as any).lastAutoTable.finalY + 10
    currentY = addSectionTitle("PARÂMETROS DE PERFURAÇÃO & SERVIÇOS", currentY)

    autoTable(doc, {
        startY: currentY,
        head: [["Diâmetro", "Prof. Alvo", "Prof. Real", "Ângulo", "Azimute", "Total M."]],
        body: [[
            `${bdp.holeDiameter}mm`,
            `${bdp.targetDepth}m`,
            `${bdp.actualDepth}m`,
            `${bdp.angle}°`,
            `${bdp.azimuth}°`,
            `${bdp.totalMeters}m`
        ]],
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] }
    })

    currentY = (doc as any).lastAutoTable.finalY + 5
    // Service list
    doc.setFont("helvetica", "bold")
    doc.text("Serviços Executados:", 14, currentY)
    doc.setFont("helvetica", "normal")
    const servicesText = bdp.selectedServices.join(", ")
    const servicesLines = doc.splitTextToSize(servicesText, pageWidth - 30)
    doc.text(servicesLines, 14, currentY + 5)

    // 5. LOCALIZAÇÃO & GEOLOGIA
    currentY = currentY + 10 + (servicesLines.length * 4)
    currentY = addSectionTitle("LOCALIZAÇÃO & GEOLOGIA", currentY)

    autoTable(doc, {
        startY: currentY,
        head: [["Coordenadas", "Furo/Grid", "Descrição Material", "Perfil Lit."]],
        body: [[
            bdp.gpsCoordinates || "-",
            `${bdp.holeNumber || "-"} / ${bdp.gridLocation || "-"}`,
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

    const occurrences = bdp.occurrences && bdp.occurrences.length ? bdp.occurrences.join(", ") : "Sem ocorrências"

    const suppliesList = []
    if (bdp.supplies.diesel) suppliesList.push("Diesel")
    if (bdp.supplies.oil220) suppliesList.push("Óleo 220")
    if (bdp.supplies.oil90) suppliesList.push("Óleo 90")
    if (bdp.supplies.oil68) suppliesList.push("Óleo 68")
    if (bdp.supplies.oil15w40) suppliesList.push("Óleo 15w40")
    if (bdp.supplies.greaseCommon) suppliesList.push("Graxa Comum")
    if (bdp.supplies.greaseGraphited) suppliesList.push("Graxa Grafitada")
    const supplies = suppliesList.length ? suppliesList.join(", ") : "Nenhum registrado"

    autoTable(doc, {
        startY: currentY,
        body: [
            ["Ocorrências", occurrences],
            ["Insumos", supplies]
        ],
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', width: 40 } }
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
    doc.save(`BDP_${bdp.projectName}_${bdp.date}_${bdp.drillId}.pdf`)
}
