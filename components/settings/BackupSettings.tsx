"use client"

import { useState } from "react"
import { Loader2, Database, Download, History, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function BackupSettings() {
    const [isLoading, setIsLoading] = useState(false)
    const [backups, setBackups] = useState<any[]>([]) // Initially empty as requested

    async function handleCreateBackup() {
        setIsLoading(true)
        // Simulate backup creation
        setTimeout(() => {
            setIsLoading(false)
            toast({
                title: "Backup criado",
                description: "O backup dos dados foi solicitado com sucesso.",
            })
            // In a real app, refresh the list or download
        }, 1500)
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="gap-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Database className="w-6 h-6 text-blue-700" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Backups</CardTitle>
                            <CardDescription>
                                Gerencie os backups automáticos dos seus dados
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                        <div className="space-y-1">
                            <h3 className="font-medium">Criar Backup Manual</h3>
                            <p className="text-sm text-muted-foreground">
                                Crie um ponto de restauração imediato do sistema.
                            </p>
                        </div>
                        <Button onClick={handleCreateBackup} disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Download className="mr-2 h-4 w-4" />
                            Criar Backup
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <History className="w-5 h-5 text-slate-500" />
                            <h3 className="font-semibold text-lg">Histórico de Backups</h3>
                        </div>
                        <p className="text-sm text-slate-500">
                            Seus backups mais recentes estão listados abaixo
                        </p>

                        {backups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg bg-slate-50/50">
                                <Database className="h-10 w-10 text-slate-300 mb-2" />
                                <p className="text-slate-900 font-medium">Nenhum backup encontrado</p>
                                <p className="text-sm text-slate-500">Crie seu primeiro backup clicando no botão acima</p>
                            </div>
                        ) : (
                            <div className="border rounded-lg divide-y">
                                {/* List items would go here */}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="gap-2">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <ShieldCheck className="w-6 h-6 text-green-700" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Backup Automático</CardTitle>
                            <CardDescription>
                                Configure backups automáticos dos seus dados
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Alert className="bg-blue-50 border-blue-200">
                        <ShieldCheck className="h-4 w-4 text-blue-600" />
                        <AlertTitle className="text-blue-800 font-medium">Proteção de Dados</AlertTitle>
                        <AlertDescription className="text-blue-700 mt-2">
                            <p className="mb-2">
                                Os backups automáticos podem ser configurados para rodar diariamente usando Supabase Cron Jobs.
                                Todos os seus dados (fazendas, lotes, animais, pesagens, vacinas e custos) serão salvos de forma segura.
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                <li>Para ativar backups automáticos: Entre em contato com o administrador.</li>
                                <li>Os backups são armazenados de forma segura no sistema.</li>
                                <li>Você pode restaurar seus dados a qualquer momento.</li>
                                <li>Backups são mantidos por 30 dias.</li>
                            </ul>
                        </AlertDescription>
                    </Alert>

                    {/* Placeholder toggle since text implies configuration */}
                    <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
                        <div className="space-y-0.5">
                            <Label htmlFor="auto-backup" className="text-base">Ativar Backups Diários</Label>
                            <p className="text-sm text-muted-foreground">
                                O backup será executado automaticamente às 00:00.
                            </p>
                        </div>
                        <Switch id="auto-backup" defaultChecked />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
