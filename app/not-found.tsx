import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"

export default function NotFound() {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-slate-50 text-slate-800">
            <div className="bg-slate-200 p-6 rounded-full">
                <FileQuestion className="h-12 w-12 text-slate-500" />
            </div>
            <h2 className="text-2xl font-bold">Página não encontrada</h2>
            <p className="text-slate-500">A página que você está procurando não existe ou foi movida.</p>
            <Link href="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white mt-4">
                    Voltar para o Dashboard
                </Button>
            </Link>
        </div>
    )
}
