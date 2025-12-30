"use client"

import * as React from "react"
import { useFormStatus } from "react-dom"
import { Loader2, Mail } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { resetPasswordAction } from "@/app/auth/actions"

function SubmitButton() {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Link de Recuperação
        </Button>
    )
}

export function ForgotPasswordDialog() {
    const [open, setOpen] = React.useState(false)
    const { toast } = useToast()

    async function handleSubmit(formData: FormData) {
        const result = await resetPasswordAction(null, formData)

        if (result.success) {
            toast({
                title: "E-mail Enviado",
                description: result.message,
                variant: "default",
            })
            setOpen(false)
        } else {
            toast({
                title: "Falha na Solicitação",
                description: result.message,
                variant: "destructive",
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="link"
                    className="p-0 h-auto font-semibold text-blue-600 hover:text-blue-700 hover:no-underline text-sm"
                    type="button"
                >
                    Esqueceu a senha?
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-slate-900">Recuperar Senha</DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Insira seu e-mail cadastrado. Enviaremos um link seguro para você redefinir sua senha.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-6 pt-4">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reset-email" className="font-semibold text-slate-700">E-mail Corporativo</Label>
                            <div className="relative">
                                <Input
                                    id="reset-email"
                                    name="email"
                                    placeholder="nome@suaempresa.com"
                                    type="email"
                                    required
                                    className="pl-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 transition-all h-12"
                                />
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
