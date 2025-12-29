"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, ArrowRightLeft } from "lucide-react"

import { stockMovementSchema } from "@/lib/schemas-inventory"
import { transferStock } from "@/app/dashboard/inventory/actions"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
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
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface StockTransferDialogProps {
    items: any[]
    projects: any[]
}

export function StockTransferDialog({ items, projects }: StockTransferDialogProps) {
    const { toast } = useToast()
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, setIsPending] = useState(false)

    const form = useForm({
        resolver: zodResolver(stockMovementSchema),
        defaultValues: {
            itemId: "",
            targetProjectId: "",
            quantity: 1,
        },
    })

    const onSubmit = async (data: any) => {
        setIsPending(true)
        const supabase = createClient()

        try {
            // 1. Get current item details
            const selectedItem = items.find(i => i.id === data.itemId)
            if (!selectedItem) throw new Error("Item não encontrado")

            if (selectedItem.quantity < data.quantity) {
                toast({
                    variant: "destructive",
                    title: "Estoque insuficiente",
                    description: `A obra de origem só tem ${selectedItem.quantity} unidades.`,
                })
                setIsPending(false)
                return
            }

            // 2. Start Transaction (Client-side simulation mainly, or call server action if transactional)
            // For simplicity and to avoid complex RLS functions, we do checks here and call server action ideally
            // OR we do sequential updates.
            // Since we didn't create a server action for "transfer", let's create a new one or handle it simple.
            // Wait, let's create a Server Action for this to ensure consistency.

            // Call Server Action directly
            const result = await transferStock(data)

            if (result.error) {
                toast({
                    variant: "destructive",
                    title: "Erro na transferência",
                    description: result.error,
                })
            } else {
                toast({
                    title: "Transferência Realizada",
                    description: "O estoque foi movimentado com sucesso.",
                })
                setIsOpen(false)
                form.reset()
                router.refresh()
            }

        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.message || "Erro desconhecido",
            })
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-12 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold">
                    <ArrowRightLeft className="mr-2 h-5 w-5" /> Transferência
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Movimentar Estoque</DialogTitle>
                    <DialogDescription>
                        Transfira itens de uma obra para outra.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="itemId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Item de Origem</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o item..." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {items.map((item) => (
                                            <SelectItem key={item.id} value={item.id}>
                                                {item.name} ({item.projects?.name}) - Qtd: {item.quantity}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="flex gap-4 items-center animate-in fade-in slide-in-from-top-2">
                            <div className="flex justify-center items-center p-2 bg-slate-100 rounded-full">
                                <ArrowRightLeft className="w-4 h-4 text-slate-400" />
                            </div>
                            <div className="flex-1">
                                <FormField control={form.control} name="targetProjectId" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Obra de Destino</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="border-blue-200 bg-blue-50/50">
                                                    <SelectValue placeholder="Para onde vai?" />
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
                            </div>
                        </div>

                        <FormField control={form.control} name="quantity" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Quantidade a Transferir</FormLabel>
                                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={isPending} className="bg-blue-600 hover:bg-blue-700 w-full">
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirmar Transferência
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
