"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { inventoryItemSchema, InventoryItemSchema, InventoryItem, unitSchema } from "@/lib/schemas-inventory"
import { createInventoryItem, updateInventoryItem } from "@/app/dashboard/inventory/actions"
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

interface InventoryFormProps {
    item?: InventoryItem
    projects: Project[]
}

export function InventoryForm({ item, projects }: InventoryFormProps) {
    const { toast } = useToast()
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)

    const form = useForm<InventoryItemSchema>({
        resolver: zodResolver(inventoryItemSchema),
        defaultValues: {
            name: item?.name || "",
            projectId: item?.projectId || "",
            unit: (item?.unit as any) || "Unidade",
            brand: item?.brand || "",
            quantity: Number(item?.quantity) || 0,
            value: Number(item?.value) || 0,
            minStock: Number(item?.minStock) || 5,
        },
    })

    const onSubmit = async (data: InventoryItemSchema) => {
        setIsPending(true)
        try {
            const result = item
                ? await updateInventoryItem(item.id, data)
                : await createInventoryItem(data)

            if (result.error) {
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: result.error,
                })
            } else {
                toast({
                    title: "Sucesso",
                    description: `Item ${item ? "atualizado" : "criado"} com sucesso.`,
                })
                router.refresh()
                router.push("/dashboard/inventory")
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xl font-bold text-slate-700">Nome do Item</FormLabel>
                                <FormControl><Input className="h-16 text-xl font-medium" placeholder="Ex: Broca 64mm" {...field} /></FormControl>
                                <FormMessage className="text-lg" />
                            </FormItem>
                        )} />
                    </div>

                    <FormField control={form.control} name="projectId" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xl font-bold text-slate-700">Projeto / Obra</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="h-16 text-xl font-medium">
                                        <SelectValue placeholder="Selecione a obra..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {projects.map((p) => (
                                        <SelectItem className="text-xl font-medium py-3" key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage className="text-lg" />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="brand" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xl font-bold text-slate-700">Marca</FormLabel>
                            <FormControl><Input className="h-16 text-xl font-medium" placeholder="Ex: Sandvik" {...field} /></FormControl>
                            <FormMessage className="text-lg" />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="unit" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xl font-bold text-slate-700">Unidade de Medida</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger className="h-16 text-xl font-medium">
                                        <SelectValue placeholder="Unidade..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {unitSchema.options.map((u) => (
                                        <SelectItem className="text-xl font-medium py-3" key={u} value={u}>{u}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage className="text-lg" />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="quantity" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xl font-bold text-slate-700">Quantidade Atual</FormLabel>
                            <FormControl><Input className="h-16 text-xl font-medium" type="number" step="0.01" {...field} /></FormControl>
                            <FormMessage className="text-lg" />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="value" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xl font-bold text-slate-700">Valor Unitário (R$)</FormLabel>
                            <FormControl><Input className="h-16 text-xl font-medium" type="number" step="0.01" {...field} /></FormControl>
                            <FormMessage className="text-lg" />
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="minStock" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xl font-bold text-slate-700">Estoque Mínimo (Alerta)</FormLabel>
                            <FormControl><Input className="h-16 text-xl font-medium" type="number" step="1" {...field} /></FormControl>
                            <FormMessage className="text-lg" />
                        </FormItem>
                    )} />
                </div>

                <div className="pt-8 flex justify-end">
                    <Button type="submit" disabled={isPending} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-xl h-16 px-10 rounded-2xl font-black shadow-xl shadow-blue-600/20">
                        {isPending && <Loader2 className="mr-2 h-6 w-6 animate-spin" />}
                        {item ? "Salvar Alterações" : "Cadastrar Item"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
