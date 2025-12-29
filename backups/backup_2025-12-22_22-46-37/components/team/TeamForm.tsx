"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { teamMemberSchema, TeamMemberSchema, TeamMember } from "@/lib/schemas-team"
import { createTeamMember, updateTeamMember } from "@/app/dashboard/team/actions"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

interface TeamFormProps {
    member?: TeamMember
    onSuccess: () => void
}

const ROLES = ["Operador", "Ajudante", "Supervisor", "Encarregado", "Mecânico", "Eletricista", "Motorista", "Auxiliar"]

export function TeamForm({ member, onSuccess }: TeamFormProps) {
    const { toast } = useToast()
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)

    const form = useForm<TeamMemberSchema>({
        resolver: zodResolver(teamMemberSchema),
        defaultValues: {
            name: member?.name || "",
            role: member?.role || "Operador",
            status: (member?.status as any) || "Ativo",
        },
    })

    const onSubmit = async (data: TeamMemberSchema) => {
        setIsPending(true)
        try {
            const result = member
                ? await updateTeamMember(member.id, data)
                : await createTeamMember(data)

            if (result.error) {
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: result.error,
                })
            } else {
                toast({
                    title: "Sucesso",
                    description: `Membro ${member ? "atualizado" : "adicionado"} com sucesso.`,
                })
                router.refresh()
                router.push("/dashboard/team")
            }
        } catch (error) {
            console.error(error)
            toast({
                variant: "destructive",
                title: "Erro",
                description: "Ocorreu um erro inesperado.",
            })
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl><Input placeholder="Ex: João da Silva" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="role" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Função / Cargo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {ROLES.map((r) => (
                                    <SelectItem key={r} value={r}>{r}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />

                <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status..." />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Ativo">Ativo</SelectItem>
                                <SelectItem value="Inativo">Inativo</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )} />

                <div className="pt-4 flex justify-end">
                    <Button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-700 font-bold">
                        {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        {member ? "Salvar Alterações" : "Adicionar Membro"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
