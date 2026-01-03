"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { Calendar as CalendarIcon, DollarSign, TrendingUp, History } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { createPriceHistory } from "@/app/dashboard/inventory/actions"


const priceHistorySchema = z.object({
    itemName: z.string().min(1, "Selecione um item"),
    price: z.coerce.number().min(0.01, "Preço inválido"),
    date: z.string().min(1, "Data é obrigatória"),
})

interface InventoryPriceHistoryProps {
    items: { name: string }[] // Pass only unique names or items
    history?: { id: string, item_name: string, price: number, date: string }[]
}

export function InventoryPriceHistory({ items, history = [] }: InventoryPriceHistoryProps) {
    const { toast } = useToast()
    const [open, setOpen] = useState(false)

    // Filter unique item names for the dropdown
    const uniqueItems = Array.from(new Set(items.map(i => i.name))).sort()

    const form = useForm<z.infer<typeof priceHistorySchema>>({
        resolver: zodResolver(priceHistorySchema),
        defaultValues: {
            itemName: "",
            price: 0,
            date: format(new Date(), 'yyyy-MM-dd'),
        },
    })

    async function onSubmit(data: z.infer<typeof priceHistorySchema>) {
        const result = await createPriceHistory(data)

        if (result.error) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: result.error,
            })
        } else {
            toast({
                title: "Preço registrado!",
                description: `R$ ${data.price} para ${data.itemName} em ${format(new Date(data.date), 'dd/MM/yyyy')}.`,
            })
            setOpen(false)
            form.reset()
        }
    }

    return (
        <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        Histórico de Preços
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-1">Monitore a flutuação de custos de insumos críticos (Diesel, Aço, etc).</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50">
                            <DollarSign className="w-4 h-4 mr-2" />
                            Novo Preço
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Registrar Preço de Insumo</DialogTitle>
                            <DialogDescription>
                                Informe o valor unitário pago na data específica.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                                <FormField
                                    control={form.control}
                                    name="itemName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Insumo / Item</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecione..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {uniqueItems.map(name => (
                                                        <SelectItem key={name} value={name}>{name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Preço Unit. (R$)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="date"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Data Base</FormLabel>
                                                <FormControl>
                                                    <Input type="date" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white">Salvar Registro</Button>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <div className="h-[200px] w-full rounded-md border border-slate-100 bg-slate-50/50 p-4 overflow-y-auto">
                    {history.length === 0 ? (
                        <div className="text-center text-slate-400 py-8 text-sm">
                            Nenhum histórico registrado ainda.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map((record) => (
                                <div key={record.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-100 p-2 rounded-full">
                                            <History className="w-4 h-4 text-slate-500" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{record.item_name}</p>
                                            <p className="text-xs text-slate-500">{format(new Date(record.date), 'dd/MM/yyyy')}</p>
                                        </div>
                                    </div>
                                    <span className="font-mono font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md text-sm">
                                        R$ {record.price.toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
