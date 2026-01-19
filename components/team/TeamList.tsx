"use client"

import { useState } from "react"
import { Edit, Trash2, Plus, Users, Shield, Printer, AlertTriangle, AlertCircle } from "lucide-react"
import { differenceInDays, parseISO } from "date-fns"
import { TeamMember } from "@/lib/schemas-team"
import { deleteTeamMember, getEpiHistory } from "@/app/dashboard/team/actions"
import { generateEPISheet } from "./generate-epi-sheet"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CompanySettingsSchema } from "@/lib/schemas-settings"
import { cn } from "@/lib/utils"

import { cn } from "@/lib/utils"
import { UnifiedActionButtons } from "@/components/ui/unified-actions"

import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

interface TeamListProps {
    members: TeamMember[]
    companySettings?: CompanySettingsSchema & { logo_url?: string | null } | null
}

export function TeamList({ members, companySettings }: TeamListProps) {
    const { toast } = useToast()
    const router = useRouter()

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja remover este membro?")) return
        const result = await deleteTeamMember(id)
        if (result.error) {
            toast({ variant: "destructive", title: "Erro", description: result.error })
        } else {
            toast({ title: "Sucesso", description: "Membro removido." })
        }
    }

    const handlePrintEpi = async (member: TeamMember) => {
        try {
            toast({ title: "Gerando PDF...", description: "Aguarde um momento." })
            const history = await getEpiHistory(member.id)
            generateEPISheet(member.name, member.role, history, companySettings)
            toast({ title: "Sucesso", description: "Ficha de EPI gerada." })
        } catch (e) {
            toast({ variant: "destructive", title: "Erro", description: "Falha ao gerar PDF." })
        }
    }

    return (
        <>
            <div className="flex justify-end mb-8">
                <div className="flex justify-end mb-8">
                    <Link
                        href="/dashboard/team/new"
                        className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 rounded-2xl h-14 px-8 font-black text-lg transition-all hover:scale-105"
                    >
                        <Plus className="mr-2 h-6 w-6" /> Adicionar Membro
                    </Link>
                </div>
            </div>

            <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
                <CardHeader className="border-b border-slate-100 bg-white p-6 md:p-8">
                    <CardTitle className="text-3xl font-black text-slate-800">Membros da Equipe</CardTitle>
                    <CardDescription className="text-lg">Colaboradores ativos no sistema.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="pl-8 font-bold text-base uppercase text-slate-500 py-4">Nome</TableHead>
                                <TableHead className="font-bold text-base uppercase text-slate-500">Função</TableHead>
                                <TableHead className="font-bold text-base uppercase text-slate-500">Status</TableHead>
                                <TableHead className="font-bold text-base uppercase text-slate-500 text-right pr-8">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-40 text-center text-slate-400 text-xl font-medium">
                                        Nenhum membro encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                members.map((member) => (
                                    <TableRow key={member.id} className="hover:bg-slate-50/50 cursor-pointer h-24" onClick={() => router.push(`/dashboard/team/${member.id}`)}>
                                        <TableCell className="pl-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="p-4 bg-slate-100 rounded-2xl">
                                                    <Users className="h-6 w-6 text-slate-500" />
                                                </div>
                                                <div>
                                                    <div className="font-black text-slate-800 text-2xl tracking-tight flex items-center gap-2">
                                                        {member.registrationNumber && (
                                                            <span className="text-sm font-mono text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                                                {member.registrationNumber}
                                                            </span>
                                                        )}
                                                        {member.name}
                                                    </div>
                                                    <div className="flex flex-col gap-1 mt-1">
                                                        {member.linked_user_id && (
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="bg-green-500 rounded-full w-2 h-2 animate-pulse" />
                                                                <span className="text-xs font-bold text-green-600 uppercase tracking-wide">Acesso Liberado</span>
                                                            </div>
                                                        )}
                                                        {/* ASO Warning Logic */}
                                                        {(() => {
                                                            if (!member.asoDate) return null
                                                            const days = differenceInDays(parseISO(member.asoDate), new Date())
                                                            // Expired (Red)
                                                            if (days < 0) {
                                                                return (
                                                                    <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2 py-0.5 rounded-md w-fit border border-red-100">
                                                                        <AlertCircle className="w-3 h-3" />
                                                                        <span className="text-[10px] font-bold uppercase">ASO Vencido há {Math.abs(days)} dias</span>
                                                                    </div>
                                                                )
                                                            }
                                                            // Expiring soon (Yellow - 30 days)
                                                            if (days <= 30) {
                                                                return (
                                                                    <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md w-fit border border-amber-100">
                                                                        <AlertTriangle className="w-3 h-3" />
                                                                        <span className="text-[10px] font-bold uppercase">ASO Vence em {days} dias</span>
                                                                    </div>
                                                                )
                                                            }
                                                            return null
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Shield className="w-5 h-5 text-blue-500" />
                                                <span className="text-slate-600 font-bold text-lg">{member.role}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={member.status === "Ativo" ? "default" : "secondary"}
                                                className={cn(
                                                    "text-base px-4 py-1.5 rounded-lg",
                                                    member.status === "Ativo" && "bg-green-100 text-green-700 hover:bg-green-200 border-green-200",
                                                    member.status === "Férias" && "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200",
                                                    member.status === "Atestado" && "bg-red-100 text-red-700 hover:bg-red-200 border-red-200",
                                                    member.status === "Inativo" && "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                                )}
                                            >
                                                {member.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <UnifiedActionButtons
                                                editLink={`/dashboard/team/${member.id}`}
                                                onDelete={(e) => { e.stopPropagation(); handleDelete(member.id) }}
                                                onPrint={(e) => { e.stopPropagation(); handlePrintEpi(member) }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </>
    )
}
