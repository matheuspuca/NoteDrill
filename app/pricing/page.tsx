"use client"

import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function PricingContent() {
    const searchParams = useSearchParams()
    const reason = searchParams.get("reason")

    return (
        <>
            {/* Header */}
            <div className="text-center space-y-4">
                {reason === "trial_expired" && (
                    <div className="bg-red-100 text-red-700 px-4 py-2 rounded-full inline-block font-semibold border border-red-200 mb-4">
                        Seu período de teste expirou. Escolha um plano para continuar.
                    </div>
                )}
                <h1 className="text-4xl font-extrabold text-slate-900">Escolha o plano ideal para sua operação</h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                    Desbloqueie todo o potencial do NoteDrill com nossos planos flexíveis.
                </p>
            </div>
        </>
    )
}

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-5xl w-full space-y-8">

                <Suspense fallback={<div>Carregando opções...</div>}>
                    <PricingContent />
                </Suspense>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-8 mt-12">

                    {/* Basic */}
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-slate-900">Basic</h3>
                            <div className="mt-4 flex items-baseline">
                                <span className="text-4xl font-extrabold tracking-tight text-slate-900">R$ 699</span>
                                <span className="ml-1 text-xl font-semibold text-slate-500">/mês</span>
                            </div>
                            <p className="mt-4 text-slate-500">Para operadores individuais e freelancers.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center text-slate-600"><Check className="h-5 w-5 text-green-500 mr-2" /> 1 Perfuratriz</li>
                            <li className="flex items-center text-slate-600"><Check className="h-5 w-5 text-green-500 mr-2" /> 1 Obra Ativa</li>
                            <li className="flex items-center text-slate-600"><Check className="h-5 w-5 text-green-500 mr-2" /> Relatórios PDF Simples</li>
                        </ul>
                        <Button className="w-full" variant="outline">Falar com Consultor</Button>
                    </div>

                    {/* Pro */}
                    <div className="bg-slate-900 text-white p-8 rounded-2xl border-2 border-blue-500 shadow-xl flex flex-col relative transform scale-105">
                        <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                            MAIS POPULAR
                        </div>
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-white">Pro</h3>
                            <div className="mt-4 flex items-baseline">
                                <span className="text-4xl font-extrabold tracking-tight text-white">R$ 1.299</span>
                                <span className="ml-1 text-xl font-semibold text-slate-400">/mês</span>
                            </div>
                            <p className="mt-4 text-slate-300">Para pequenas empresas e equipes em crescimento.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center text-slate-200"><Check className="h-5 w-5 text-blue-400 mr-2" /> Até 3 Perfuratrizes</li>
                            <li className="flex items-center text-slate-200"><Check className="h-5 w-5 text-blue-400 mr-2" /> Até 3 Obras Ativas</li>
                            <li className="flex items-center text-slate-200"><Check className="h-5 w-5 text-blue-400 mr-2" /> Gestão de Estoque</li>
                            <li className="flex items-center text-slate-200"><Check className="h-5 w-5 text-blue-400 mr-2" /> Múltiplos Operadores</li>
                        </ul>
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Falar com Consultor</Button>
                    </div>

                    {/* Enterprise */}
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="mb-8">
                            <h3 className="text-xl font-bold text-slate-900">Enterprise</h3>
                            <div className="mt-4 flex items-baseline">
                                <span className="text-4xl font-extrabold tracking-tight text-slate-900">Sob Consulta</span>
                            </div>
                            <p className="mt-4 text-slate-500">Para grandes operações e mineradoras.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            <li className="flex items-center text-slate-600"><Check className="h-5 w-5 text-green-500 mr-2" /> Equipamentos Ilimitados</li>
                            <li className="flex items-center text-slate-600"><Check className="h-5 w-5 text-green-500 mr-2" /> Obras Ilimitadas</li>
                            <li className="flex items-center text-slate-600"><Check className="h-5 w-5 text-green-500 mr-2" /> API & Integrações</li>
                            <li className="flex items-center text-slate-600"><Check className="h-5 w-5 text-green-500 mr-2" /> Suporte Dedicado 24/7</li>
                        </ul>
                        <Button className="w-full" variant="outline">Falar com Consultor</Button>
                    </div>

                </div>

                <div className="text-center mt-8">
                    <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-900 underline">
                        Voltar para Dashboard (se liberado)
                    </Link>
                </div>
            </div>
        </div>
    )
}
