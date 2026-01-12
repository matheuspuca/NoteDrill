"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Bell, Mail, AlertCircle, Smartphone } from "lucide-react"

export function NotificationSettings() {
    // States for toggles (mocked for now, can be persisted later)
    const [emailAlerts, setEmailAlerts] = useState(true)
    const [pushAlerts, setPushAlerts] = useState(false)
    const [systemAlerts, setSystemAlerts] = useState(true)
    const [marketing, setMarketing] = useState(false)

    return (
        <Card className="border-none shadow-lg bg-white rounded-2xl ring-1 ring-slate-100">
            <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Bell className="w-6 h-6 text-blue-600" />
                    Preferências de Notificação
                </CardTitle>
                <CardDescription className="text-base text-slate-500">Escolha como você deseja receber alertas e atualizações.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

                <div className="flex items-center justify-between space-x-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-start space-x-4">
                        <Mail className="mt-1 h-5 w-5 text-slate-500" />
                        <div className="space-y-1">
                            <Label htmlFor="email-alerts" className="text-lg font-bold text-slate-800">Alertas por Email</Label>
                            <p className="text-base text-slate-500">Receba resumos diários e alertas críticos via email.</p>
                        </div>
                    </div>
                    <Switch id="email-alerts" checked={emailAlerts} onCheckedChange={setEmailAlerts} />
                </div>

                <div className="flex items-center justify-between space-x-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-start space-x-4">
                        <Smartphone className="mt-1 h-5 w-5 text-slate-500" />
                        <div className="space-y-1">
                            <Label htmlFor="push-alerts" className="text-lg font-bold text-slate-800">Notificações Push</Label>
                            <p className="text-base text-slate-500">Receba notificações em tempo real no seu dispositivo.</p>
                        </div>
                    </div>
                    <Switch id="push-alerts" checked={pushAlerts} onCheckedChange={setPushAlerts} />
                </div>

                <div className="flex items-center justify-between space-x-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-start space-x-4">
                        <AlertCircle className="mt-1 h-5 w-5 text-slate-500" />
                        <div className="space-y-1">
                            <Label htmlFor="system-alerts" className="text-lg font-bold text-slate-800">Alertas do Sistema</Label>
                            <p className="text-base text-slate-500">Avisos sobre manutenções, estoque baixo e segurança.</p>
                        </div>
                    </div>
                    <Switch id="system-alerts" checked={systemAlerts} onCheckedChange={setSystemAlerts} />
                </div>

                <div className="flex items-center justify-between space-x-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-start space-x-4">
                        <Bell className="mt-1 h-5 w-5 text-slate-500" />
                        <div className="space-y-1">
                            <Label htmlFor="marketing" className="text-lg font-bold text-slate-800">Novidades e Dicas</Label>
                            <p className="text-base text-slate-500">Receba novidades sobre atualizações do NoteDrill.</p>
                        </div>
                    </div>
                    <Switch id="marketing" checked={marketing} onCheckedChange={setMarketing} />
                </div>

            </CardContent>
        </Card>
    )
}
