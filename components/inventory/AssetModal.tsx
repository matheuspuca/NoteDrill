"use server"
// Actually this is client component
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Calendar as CalendarIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { assetSchema, AssetSchema, ProjectAsset } from "@/lib/schemas-inventory"
import { createAsset, updateAsset } from "@/app/dashboard/inventory/assets/actions"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
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
import { useToast } from "@/components/ui/use-toast"

interface AssetModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    assetToEdit?: ProjectAsset
    projects: { id: string, name: string }[]
}

export function AssetModal({ open, onOpenChange, assetToEdit, projects }: AssetModalProps) {
    const { toast } = useToast()
    const [isPending, setIsPending] = useState(false)

    const form = useForm<AssetSchema>({
        resolver: zodResolver(assetSchema),
        defaultValues: {
            name: "",
            purchase_date: "",
            invoice_number: "",
            value: 0,
            quantity: 1,
            tag_number: "",
            project_id: "",
            description: ""
        },
    })

    useEffect(() => {
        if (open) {
            if (assetToEdit) {
                form.reset({
                    name: assetToEdit.name,
                    purchase_date: assetToEdit.purchase_date || "",
                    invoice_number: assetToEdit.invoice_number || "",
                    value: Number(assetToEdit.value),
                    quantity: Number(assetToEdit.quantity),
                    tag_number: assetToEdit.tag_number || "",
                    project_id: assetToEdit.project_id || "",
                    description: assetToEdit.description || ""
                })
            } else {
                form.reset({
                    name: "",
                    purchase_date: new Date().toISOString().split('T')[0],
                    invoice_number: "",
                    value: 0,
                    quantity: 1,
                    tag_number: "",
                    project_id: "",
                    description: ""
                })
            }
        }
    }, [open, assetToEdit, form])

    const onSubmit = async (data: AssetSchema) => {
        setIsPending(true)
        try {
            const result = assetToEdit
                ? await updateAsset(assetToEdit.id, data)
                : await createAsset(data)

            if (result.error) {
                toast({ variant: "destructive", title: "Erro", description: result.error })
            } else {
                toast({ title: "Sucesso", description: `Patrimônio ${assetToEdit ? "atualizado" : "registrado"}.` })
                onOpenChange(false)
            }
        } catch (error) {
            console.error(error)
            toast({ variant: "destructive", title: "Erro", description: "Ocorreu um erro inesperado." })
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] rounded-3xl p-8">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-slate-800">
                        {assetToEdit ? "Editar Patrimônio" : "Novo Patrimônio"}
                    </DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">

                        {/* Row 1: Name & Project */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-slate-700">Nome do Item</FormLabel>
                                    <FormControl><Input placeholder="Ex: Notebook Dell" className="h-12" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="project_id" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-slate-700">Obra / Local</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value || "no-project"}>
                                        <FormControl>
                                            <SelectTrigger className="h-12">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="no-project">Estoque Geral</SelectItem>
                                            {projects.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {/* Row 2: Tag, NF, Date */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField control={form.control} name="tag_number" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-slate-700">Tag / ID</FormLabel>
                                    <FormControl><Input placeholder="Ex: PAT-001" className="h-12" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="invoice_number" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-slate-700">Nota Fiscal</FormLabel>
                                    <FormControl><Input placeholder="Nº NF" className="h-12" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="purchase_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-slate-700">Compra</FormLabel>
                                    <FormControl><Input type="date" className="h-12" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {/* Row 3: Value & Quantity */}
                        <div className="grid grid-cols-2 gap-6">
                            <FormField control={form.control} name="value" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-slate-700">Valor Unitário (R$)</FormLabel>
                                    <FormControl><Input type="number" step="0.01" className="h-12" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="quantity" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-bold text-slate-700">Quantidade</FormLabel>
                                    <FormControl><Input type="number" step="1" className="h-12" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel className="font-bold text-slate-700">Descrição</FormLabel>
                                <FormControl><Textarea className="min-h-[80px]" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-8 rounded-xl">
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
