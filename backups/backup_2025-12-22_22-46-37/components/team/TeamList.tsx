"use client"

import { useState } from "react"
import { Edit, Trash2, Plus, Users, Shield } from "lucide-react"
import { TeamMember } from "@/lib/schemas-team"
import { deleteTeamMember } from "@/app/dashboard/team/actions"
import Link from "next/link"
import { useRouter } from "next/navigation"

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
}

export function TeamList({ members }: TeamListProps) {
    const { toast } = useToast()
    const router = useRouter() // Add router

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja remover este membro?")) return
        const result = await deleteTeamMember(id)
        if (result.error) {
            toast({ variant: "destructive", title: "Erro", description: result.error })
        } else {
            toast({ title: "Sucesso", description: "Membro removido." })
        }
    }

    return (
        <>
            <div className="flex justify-end mb-8">
                <Link href="/dashboard/team/new">
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 rounded-xl h-12 px-6 font-bold"
                    >
                        <Plus className="mr-2 h-5 w-5" /> Adicionar Membro
                    </Button>
                </Link>
            </div>

            <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white ring-1 ring-slate-100">
                <CardHeader className="border-b border-slate-100 bg-white p-6 md:p-8">
                    <CardTitle className="text-2xl font-black text-slate-800">Membros da Equipe</CardTitle>
                    <CardDescription>Colaboradores ativos no sistema.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="pl-8 font-bold text-xs uppercase text-slate-500">Nome</TableHead>
                                <TableHead className="font-bold text-xs uppercase text-slate-500">Função</TableHead>
                                <TableHead className="font-bold text-xs uppercase text-slate-500">Status</TableHead>
                                <TableHead className="font-bold text-xs uppercase text-slate-500 text-right pr-8">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-40 text-center text-slate-400">
                                        Nenhum membro encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                members.map((member) => (
                                    <TableRow key={member.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => router.push(`/dashboard/team/${member.id}`)}>
                                        <TableCell className="pl-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 rounded-lg">
                                                    <Users className="h-5 w-5 text-slate-500" />
                                                </div>
                                                <span className="font-bold text-slate-700 text-base">{member.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-slate-400" />
                                                <span className="text-slate-600">{member.role}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={member.status === "Ativo" ? "default" : "secondary"} className={member.status === "Ativo" ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}>
                                                {member.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <div className="flex justify-end gap-2">
                                                <Link href={`/dashboard/team/${member.id}`}>
                                                    <Button variant="ghost" size="icon" className="hover:text-blue-600 hover:bg-blue-50" onClick={(e) => e.stopPropagation()}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button variant="ghost" size="icon" className="hover:text-red-600 hover:bg-red-50" onClick={(e) => { e.stopPropagation(); handleDelete(member.id) }}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
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
