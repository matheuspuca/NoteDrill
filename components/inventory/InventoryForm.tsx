"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { inventoryItemSchema, InventoryItemSchema, InventoryItem, unitSchema } from "@/lib/schemas-inventory"
import { createEPI, createInventoryItem, updateInventoryItem, updateEPI } from "@/app/dashboard/inventory/actions"
import { Project } from "@/lib/schemas-project"

import { Button } from "@/components/ui/button"
import { CurrencyInput } from "@/components/ui/currency-input"
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
import { itemTypeSchema } from "@/lib/schemas-inventory"

interface InventoryFormProps {
    item?: InventoryItem
    projects: Project[]
}

export function InventoryForm({ item, projects }: InventoryFormProps) {
    const { toast } = useToast()
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)

    // Determine initial type based on whether it has CA (so it's an EPI) or defaulting to Material
    const initialType = (item?.ca) ? "EPI" : (item?.type || "Material")

    const form = useForm<InventoryItemSchema>({
        resolver: zodResolver(inventoryItemSchema),
        defaultValues: {
            name: item?.name || "",
            type: initialType as any,
            projectId: item?.projectId || "",
            unit: (item?.unit as any) || "Unidade",
            brand: item?.brand || "",
            quantity: Number(item?.quantity) || 0,
            value: Number(item?.value) || 0,
            minStock: Number(item?.minStock) || 5,
            entry_date: item?.entry_date || "",
            invoice_number: item?.invoice_number || "",
            model: item?.model || "",
            supplier: item?.supplier || "",

            ca: item?.ca || "",
            size: item?.size || "",
            expirationDate: item?.expirationDate || "",
        },
    })

    const selectedType = form.watch("type")

    const onSubmit = async (data: InventoryItemSchema) => {
        setIsPending(true)
        try {
            let result;

            if (data.type === "EPI") {
                // Validate EPI specifics manually or trust the schema if we made them required? 
                // Currently they are optional in schema, ideally we enforce them here.
                if (!data.ca) {
                    form.setError("ca", { message: "C.A. é obrigatório para EPIs" })
                    setIsPending(false)
                    return
                }

                const epiPayload = {
                    name: data.name,
                    ca: data.ca,
                    projectId: data.projectId,
                    unit: data.unit,
                    quantity: data.quantity,
                    expirationDate: data.expirationDate || null,
                    size: data.size,
                    value: data.value,
                    minStock: data.minStock,
                    // New Fields
                    model: data.model,
                    supplier: data.supplier,
                    entry_date: data.entry_date || null,
                    invoice_number: data.invoice_number
                }

                result = item
                    ? await updateEPI(item.id, epiPayload)
                    : await createEPI(epiPayload)

            } else {
                // Standard Item
                const itemPayload = {
                    name: data.name,
                    projectId: data.projectId,
                    unit: data.unit,
                    brand: data.brand,
                    quantity: data.quantity,
                    value: data.value,
                    minStock: data.minStock,
                    type: data.type,
                    // New Fields
                    model: data.model,
                    supplier: data.supplier,
                    invoice_number: data.invoice_number,
                    entry_date: data.entry_date || null
                }

                result = item
                    ? await updateInventoryItem(item.id, itemPayload as any)
                    : await createInventoryItem(itemPayload as any)
            }

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
                    <FormField control={form.control} name="type" render={({ field }) => (
                        <FormItem className="md:col-span-2">
                            <FormLabel className="text-xl font-bold text-slate-700">Tipo de Item</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!!item}>
                                <FormControl>
                                    <SelectTrigger className="h-16 text-xl font-medium">
                                        <SelectValue placeholder="Selecione o tipo..." />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {itemTypeSchema.options.map((t) => (
                                        <SelectItem className="text-xl font-medium py-3" key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage className="text-lg" />
                        </FormItem>
                    )} />

                    <div className="md:col-span-2">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xl font-bold text-slate-700">Nome do Item</FormLabel>
                                <FormControl><Input className="h-16 text-xl font-medium" placeholder={selectedType === "EPI" ? "Ex: Capacete de Segurança" : "Ex: Broca 64mm"} {...field} /></FormControl>
                                <FormMessage className="text-lg" />
                            </FormItem>
                        )} />
                    </div>

                    {selectedType === "EPI" && (
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-8 bg-orange-50 p-6 rounded-2xl border border-orange-100">
                            <div className="md:col-span-3 pb-2 border-b border-orange-200 mb-2">
                                <h4 className="text-orange-800 font-bold text-lg flex items-center gap-2">Dados do EPI</h4>
                            </div>

                            <FormField control={form.control} name="ca" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xl font-bold text-slate-700">C.A. (Certificado)</FormLabel>
                                    <FormControl><Input className="h-14 text-xl font-medium" placeholder="Ex: 12345" {...field} /></FormControl>
                                    <FormMessage className="text-lg" />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="size" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xl font-bold text-slate-700">Tamanho</FormLabel>
                                    <FormControl><Input className="h-14 text-xl font-medium" placeholder="Ex: G, 42, Único" {...field} /></FormControl>
                                    <FormMessage className="text-lg" />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="expirationDate" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xl font-bold text-slate-700">Validade (Opcional)</FormLabel>
                                    <FormControl><Input type="date" className="h-14 text-xl font-medium" {...field} /></FormControl>
                                    <FormMessage className="text-lg" />
                                </FormItem>
                            )} />
                        </div>
                    )}


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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField control={form.control} name="brand" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xl font-bold text-slate-700">Marca/Fabricante</FormLabel>
                                <FormControl><Input className="h-16 text-xl font-medium" placeholder="Ex: 3M, Sandvik" {...field} /></FormControl>
                                <FormMessage className="text-lg" />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="model" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xl font-bold text-slate-700">Modelo</FormLabel>
                                <FormControl><Input className="h-16 text-xl font-medium" placeholder="Ex: X200, Premium" {...field} /></FormControl>
                                <FormMessage className="text-lg" />
                            </FormItem>
                        )} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <div className="md:col-span-3 pb-2 border-b border-slate-200 mb-2">
                            <h4 className="text-slate-600 font-bold text-lg flex items-center gap-2">Dados de Entrada</h4>
                        </div>

                        <FormField control={form.control} name="supplier" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-lg font-bold text-slate-700">Fornecedor</FormLabel>
                                <FormControl><Input className="h-14 text-lg" placeholder="Nome do Fornecedor" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="entry_date" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-lg font-bold text-slate-700">Data Lançamento</FormLabel>
                                <FormControl><Input type="date" className="h-14 text-lg" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="invoice_number" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-lg font-bold text-slate-700">Número da NF</FormLabel>
                                <FormControl><Input className="h-14 text-lg" placeholder="Ex: 000.123" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                    </div>

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
                            <FormLabel className="text-xl font-bold text-slate-700">Valor Unitário</FormLabel>
                            <FormControl>
                                <CurrencyInput
                                    className="h-16 text-xl font-medium"
                                    value={field.value}
                                    onChange={field.onChange}
                                />
                            </FormControl>
                            <FormMessage className="text-lg" />
                        </FormItem>
                    )} />

                    <div className="md:col-span-2 md:w-1/2">
                        <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200">
                            <span className="block text-sm font-bold text-slate-500 uppercase">Valor Total do Estoque</span>
                            <div className="text-3xl font-black text-slate-800 mt-1">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                    (form.watch("quantity") || 0) * (form.watch("value") || 0)
                                )}
                            </div>
                        </div>
                    </div>

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
        </Form >
    )
}
