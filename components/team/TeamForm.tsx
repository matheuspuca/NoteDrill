"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { teamMemberSchema, TeamMemberSchema, TeamMember } from "@/lib/schemas-team"
import { CompanySettingsSchema } from "@/lib/schemas-settings"
import { createTeamMember, updateTeamMember } from "@/app/dashboard/team/actions"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff } from "lucide-react"

import { Plus, Printer, HardHat } from "lucide-react"
import { assignEpi } from "@/app/dashboard/team/actions"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { generateEPISheet } from "./generate-epi-sheet"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface TeamFormProps {
    member?: TeamMember

    epis?: any[]
    epiHistory?: any[]
    companySettings?: CompanySettingsSchema & { logo_url?: string | null } | null
}

const ROLES = ["Operador", "Ajudante", "Supervisor", "Encarregado", "Mecânico", "Eletricista", "Motorista", "Auxiliar"]
const SYSTEM_ROLES = [
    { value: "admin", label: "Admin (Gestor)" },
    { value: "supervisor", label: "Supervisor" },
    { value: "operator", label: "Operador" }
]

export function TeamForm({ member, epis = [], epiHistory = [], companySettings }: TeamFormProps) {
    const { toast } = useToast()
    const router = useRouter()
    const [isPending, setIsPending] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const form = useForm<TeamMemberSchema>({
        resolver: zodResolver(teamMemberSchema),
        defaultValues: {
            name: member?.name || "",
            role: member?.role || "Operador",
            status: (member?.status as any) || "Ativo",
            birthDate: member?.birthDate || "",
            admissionDate: member?.admissionDate || "",
            asoDate: member?.asoDate || "",
            createSystemUser: false,
            email: "",
            password: "",
            systemRole: "operator",
        },
    })

    // EPI State
    const [selectedEpiId, setSelectedEpiId] = useState("")
    const [epiQuantity, setEpiQuantity] = useState(1)
    const [isAssigning, setIsAssigning] = useState(false)

    const watchCreateSystemUser = form.watch("createSystemUser")

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

    const handleAssignEpi = async () => {
        if (!member) return
        if (!selectedEpiId) {
            toast({ variant: "destructive", title: "Erro", description: "Selecione um EPI." })
            return
        }

        setIsAssigning(true)
        const result = await assignEpi({
            teamMemberId: member.id,
            epiId: selectedEpiId,
            quantity: epiQuantity
        })

        if (result.error) {
            toast({ variant: "destructive", title: "Erro", description: result.error })
        } else {
            toast({ title: "Sucesso", description: "EPI entregue e estoque atualizado." })
            setSelectedEpiId("")
            setEpiQuantity(1)
            router.refresh()
        }
        setIsAssigning(false)
    }



    return (
        <div className="space-y-12">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, (errors) => console.log(errors))} className="space-y-8">

                    <div className="space-y-6">
                        <h3 className="text-2xl font-black text-slate-800 border-b pb-2">Dados Pessoais & Função</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem className="col-span-2 md:col-span-1">
                                    <FormLabel className="text-xl font-bold text-slate-700">Nome Completo</FormLabel>
                                    <FormControl><Input className="h-14 text-xl font-medium" placeholder="Ex: João da Silva" {...field} /></FormControl>
                                    <FormMessage className="text-lg" />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="role" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xl font-bold text-slate-700">Função / Cargo</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-14 text-xl font-medium">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {ROLES.map((r) => (
                                                <SelectItem className="text-lg py-3" key={r} value={r}>{r}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-lg" />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <FormField control={form.control} name="birthDate" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel className="text-xl font-bold text-slate-700">Data de Nascimento</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "h-14 w-full pl-3 text-left text-xl font-medium",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(new Date(field.value + "T00:00:00"), "dd/MM/yyyy")
                                                    ) : (
                                                        <span>Selecione...</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-6 w-6 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value ? new Date(field.value + "T00:00:00") : undefined}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        // Fix timezone issue by formatting local date directly
                                                        field.onChange(format(date, "yyyy-MM-dd"))
                                                    }
                                                }}
                                                disabled={(date) =>
                                                    date > new Date() || date < new Date("1900-01-01")
                                                }
                                                captionLayout="dropdown"
                                                fromYear={1950}
                                                toYear={new Date().getFullYear()}
                                                initialFocus
                                                locale={ptBR}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage className="text-lg" />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="admissionDate" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel className="text-xl font-bold text-slate-700">Data de Admissão</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "h-14 w-full pl-3 text-left text-xl font-medium",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(new Date(field.value + "T00:00:00"), "dd/MM/yyyy")
                                                    ) : (
                                                        <span>Selecione...</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-6 w-6 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value ? new Date(field.value + "T00:00:00") : undefined}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        field.onChange(format(date, "yyyy-MM-dd"))
                                                    }
                                                }}
                                                captionLayout="dropdown"
                                                fromYear={2000}
                                                toYear={new Date().getFullYear() + 1}
                                                initialFocus
                                                locale={ptBR}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage className="text-lg" />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="status" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xl font-bold text-slate-700">Status</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-14 text-xl font-medium">
                                                <SelectValue placeholder="Status..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem className="text-lg py-3" value="Ativo">Ativo</SelectItem>
                                            <SelectItem className="text-lg py-3" value="Férias">Férias</SelectItem>
                                            <SelectItem className="text-lg py-3" value="Atestado">Atestado Médico</SelectItem>
                                            <SelectItem className="text-lg py-3" value="Inativo">Inativo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage className="text-lg" />
                                </FormItem>
                            )} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-2xl font-black text-slate-800 border-b pb-2">Documentação (ASO)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <FormField control={form.control} name="asoDate" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel className="text-xl font-bold text-slate-700">Vencimento ASO</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "h-14 w-full pl-3 text-left text-xl font-medium",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    {field.value ? (
                                                        format(new Date(field.value + "T00:00:00"), "dd/MM/yyyy")
                                                    ) : (
                                                        <span>Selecione...</span>
                                                    )}
                                                    <CalendarIcon className="ml-auto h-6 w-6 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value ? new Date(field.value + "T00:00:00") : undefined}
                                                onSelect={(date) => {
                                                    if (date) {
                                                        field.onChange(format(date, "yyyy-MM-dd"))
                                                    }
                                                }}
                                                captionLayout="dropdown"
                                                fromYear={2020}
                                                toYear={new Date().getFullYear() + 5}
                                                initialFocus
                                                locale={ptBR}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage className="text-lg" />
                                </FormItem>
                            )} />
                        </div>
                    </div>

                    {!member && (
                        <div className="bg-slate-50 p-6 rounded-2xl border border-blue-100 space-y-6">
                            <h3 className="text-2xl font-black text-slate-800 border-b pb-2 flex items-center gap-2">
                                <HardHat className="h-6 w-6 text-blue-600" />
                                Acesso ao Sistema
                            </h3>

                            <FormField
                                control={form.control}
                                name="createSystemUser"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-xl bg-white shadow-sm">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                className="w-6 h-6"
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel className="text-lg font-bold text-slate-700 cursor-pointer">
                                                Criar usuário de acesso para este membro?
                                            </FormLabel>
                                            <FormDescription>
                                                Isso gerará um login e senha para que ele possa acessar o sistema ou App.
                                            </FormDescription>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            {watchCreateSystemUser && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-300">
                                    <FormField control={form.control} name="email" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xl font-bold text-slate-700">Email de Login</FormLabel>
                                            <FormControl><Input className="h-14 text-xl" placeholder="email@exemplo.com" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="password" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xl font-bold text-slate-700">Senha Temporária</FormLabel>
                                            <div className="relative">
                                                <FormControl>
                                                    <Input type={showPassword ? "text" : "password"} className="h-14 text-xl pr-10" placeholder="******" {...field} />
                                                </FormControl>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="absolute right-0 top-0 h-14 w-14 px-3"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                >
                                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                                </Button>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )} />

                                    <FormField control={form.control} name="systemRole" render={({ field }) => (
                                        <FormItem className="col-span-2">
                                            <FormLabel className="text-xl font-bold text-slate-700">Nível de Permissão</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="h-14 text-xl font-medium">
                                                        <SelectValue placeholder="Selecione o nível de acesso..." />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {SYSTEM_ROLES.map((role) => (
                                                        <SelectItem className="text-lg py-3" key={role.value} value={role.value}>
                                                            <span className="font-bold">{role.label}</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                            )}
                        </div>
                    )}


                    <div className="pt-8 flex justify-end gap-3">
                        <Button type="submit" disabled={isPending} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-xl h-16 px-10 rounded-2xl font-black shadow-xl shadow-blue-600/20">
                            {isPending && <Loader2 className="mr-2 h-6 w-6 animate-spin" />}
                            {member ? "Salvar Alterações" : "Adicionar Membro"}
                        </Button>
                    </div>
                </form>
            </Form>

            {/* EPI Section - Only visible if editing existing member */}
            {member && (
                <div className="pt-12 border-t border-slate-200 space-y-8">
                    <div className="flex items-center justify-between">
                        <h3 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                            <HardHat className="h-8 w-8 text-orange-600" />
                            Entrega de EPIs
                        </h3>
                        <Button
                            variant="outline"
                            className="border-slate-300 text-slate-700 hover:bg-slate-50 h-12 px-6 rounded-xl font-bold"
                            onClick={() => generateEPISheet(member.name, member.role, epiHistory, companySettings)}
                        >
                            <Printer className="mr-2 h-5 w-5" /> Imprimir Ficha
                        </Button>
                        {!companySettings && (
                            <span className="text-xs text-red-500 font-bold ml-2">
                                (Sem dados de empresa)
                            </span>
                        )}
                        {companySettings && (
                            <span className="text-xs text-green-500 font-bold ml-2">
                                (Empresa carregada: {companySettings.company_name})
                            </span>
                        )}
                    </div>



                    {/* Assign Form */}
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <h4 className="text-lg font-bold text-slate-700 mb-4">Nova Entrega</h4>
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 space-y-2">
                                <label className="text-sm font-bold text-slate-600">Selecione o EPI (Estoque)</label>
                                <Select value={selectedEpiId} onValueChange={setSelectedEpiId}>
                                    <SelectTrigger className="h-12 bg-white">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {epis.map(epi => (
                                            <SelectItem key={epi.id} value={epi.id}>
                                                {epi.name} (Disp: {epi.quantity} {epi.unit}) CA: {epi.ca}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="w-32 space-y-2">
                                <label className="text-sm font-bold text-slate-600">Quantidade</label>
                                <Input
                                    type="number"
                                    min={1}
                                    className="h-12 bg-white"
                                    value={epiQuantity}
                                    onChange={(e) => setEpiQuantity(Number(e.target.value))}
                                />
                            </div>
                            <Button
                                className="h-12 px-8 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl"
                                onClick={handleAssignEpi}
                                disabled={isAssigning}
                            >
                                {isAssigning ? <Loader2 className="animate-spin" /> : "Registrar Entrega"}
                            </Button>
                        </div>
                    </div>

                    {/* History Table */}
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-100">
                                <TableRow>
                                    <TableHead className="font-bold text-slate-600">Data</TableHead>
                                    <TableHead className="font-bold text-slate-600">EPI</TableHead>
                                    <TableHead className="font-bold text-slate-600">C.A.</TableHead>
                                    <TableHead className="font-bold text-slate-600">Quantidade</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {epiHistory.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-slate-400">Nenhum EPI entregue.</TableCell>
                                    </TableRow>
                                ) : (
                                    epiHistory.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium text-slate-700">
                                                {format(new Date(item.date), "dd/MM/yyyy")}
                                            </TableCell>
                                            <TableCell className="text-slate-700 font-bold">{item.inventory_epis?.name}</TableCell>
                                            <TableCell>{item.inventory_epis?.ca}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-base px-3 bg-slate-50">
                                                    {item.quantity} {item.inventory_epis?.unit}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}
        </div>
    )
}
