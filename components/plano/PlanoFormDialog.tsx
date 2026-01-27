"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Plus, Pencil } from "lucide-react"
import { planoDeFogoSchema, PlanoDeFogoSchema } from "@/lib/schemas-plano"
import { createPlano, updatePlano } from "@/app/dashboard/plano-de-fogo/plano-actions"
import { useToast } from "@/components/ui/use-toast"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
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
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface PlanoFormDialogProps {
    projects: { id: string; name: string }[]
    onSuccess?: () => void
    initialData?: PlanoDeFogoSchema & { id: string }
    trigger?: React.ReactNode
}

export function PlanoFormDialog({ projects, onSuccess, initialData, trigger }: PlanoFormDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    const form = useForm<PlanoDeFogoSchema>({
        resolver: zodResolver(planoDeFogoSchema),
        defaultValues: initialData ? {
            name: initialData.name,
            projectId: initialData.projectId,
            description: initialData.description || "",
        } : {
            name: "",
            projectId: "",
            description: "",
        },
    })

    async function onSubmit(data: PlanoDeFogoSchema) {
        setIsLoading(true)
        try {
            const result = initialData
                ? await updatePlano(initialData.id, data)
                : await createPlano(data)

            if (result.error) {
                toast({
                    variant: "destructive",
                    title: initialData ? "Erro ao atualizar plano" : "Erro ao criar plano",
                    description: result.error,
                })
            } else {
                toast({
                    title: "Sucesso!",
                    description: initialData ? "Plano de Fogo atualizado com sucesso." : "Plano de Fogo criado com sucesso.",
                })
                setOpen(false)
                if (!initialData) {
                    form.reset()
                }
                onSuccess?.()
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro inesperado",
                description: "Ocorreu um erro ao processar sua solicitação.",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-2 font-bold h-12">
                        <Plus className="w-5 h-5" />
                        Novo Plano de Fogo
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-[32px] p-8 border-none ring-1 ring-slate-100 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-slate-800">
                        {initialData ? "Editar Plano de Fogo" : "Criar Plano de Fogo"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-500 font-medium pt-1">
                        {initialData
                            ? "Altere os dados abaixo para atualizar o plano."
                            : "Preencha os dados abaixo para iniciar um novo plano de furação."}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nome do Plano</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Furação Bancada Leste 01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="projectId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Obra / Projeto</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione a Obra" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {projects.map((p) => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Observações (Opcional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Detalhes sobre a furação, malha, etc."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={isLoading} className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-12 font-bold shadow-lg shadow-orange-200">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {initialData ? "Salvar Alterações" : "Criar Plano"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
