"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { epiSchema, EPISchema, EPI } from "@/lib/schemas-epi"
import { unitSchema } from "@/lib/schemas-inventory" // Reusing unitSchema
import { createEPI, updateEPI } from "@/app/dashboard/inventory/actions"
import { Project } from "@/lib/schemas-project"

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

interface EPIFormProps {
    item?: EPI
    projects: Project[]
}

export function EPIForm({ item, projects }: EPIFormProps) {
    const { toast } = useToast()
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)

    const form = useForm<EPISchema>({
        resolver: zodResolver(epiSchema),
        defaultValues: {
            name: item?.name || "",
            projectId: item?.projectId || "",
            ca: item?.ca || "",
            unit: (item?.unit as any) || "Unidade",
            quantity: Number(item?.quantity) || 0,
            value: Number(item?.value) || 0,
            minStock: Number(item?.minStock) || 0,
            expirationDate: item?.expirationDate || "",
            size: item?.size || "",
        },
    })

    const onSubmit = async (data: EPISchema) => {
        setIsPending(true)
        try {
            // Sanitize payload
            const payload = {
                ...data,
                expirationDate: data.expirationDate || null,
            }

            const result = item
                ? await updateEPI(item.id, payload)
                : await createEPI(payload)

            if (result.error) {
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: result.error,
                })
            } else {
                toast({
                    title: "Sucesso",
                    description: `EPI ${item ? "atualizado" : "criado"} com sucesso.`,
                })
                router.refresh()
                router.push("/dashboard/inventory?tab=epis") // Redirect to EPI tab
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

    const onError = (errors: any) => {
        console.error("Form errors:", errors)
        toast({
            variant: "destructive",
            title: "Erro de Validação",
            description: "Verifique os campos obrigatórios: " + Object.keys(errors).join(", "),
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome do EPI</FormLabel>
                                <FormControl><Input placeholder="Ex: Capacete de Segurança" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

                    <FormField control={form.control} name="ca" render={({ field }) => (
                        <FormItem>
                            <FormLabel>C.A. (Certificado de Aprovação)</FormLabel>
                            <FormControl><Input placeholder="Ex: 12345" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="projectId" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Projeto / Obra</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a obra..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {projects.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="unit" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Unidade de Medida</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Unidade..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {unitSchema.options.map((u) => (
                                        <SelectItem key={u} value={u}>{u}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="quantity" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Quantidade</FormLabel>
                            <FormControl><Input type="number" step="1" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="size" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tamanho</FormLabel>
                            <FormControl><Input placeholder="Ex: G, 42, Único" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="value" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor Unitário (R$)</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0,00"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="minStock" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Estoque Mínimo</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    step="1"
                                    min="0"
                                    placeholder="0"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />

                    <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-500">Valor Total em Estoque:</span>
                        <span className="text-xl font-bold text-slate-900">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                (form.watch("quantity") || 0) * (form.watch("value") || 0)
                            )}
                        </span>
                    </div>

                    <FormField control={form.control} name="expirationDate" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Validade (CA)</FormLabel>
                            <FormControl><Input type="date" {...field} value={field.value || ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>

                <div className="pt-4 flex justify-end">
                    <Button type="submit" disabled={isPending} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-lg h-12 px-8 rounded-xl font-bold">
                        {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        {item ? "Salvar Alterações" : "Cadastrar EPI"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
