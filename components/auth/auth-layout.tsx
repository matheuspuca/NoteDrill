import Link from "next/link"
import Image from "next/image"
import { Zap } from "lucide-react"

interface AuthLayoutProps {
    children: React.ReactNode
    sideContent: React.ReactNode
    showLogo?: boolean
}

export default function AuthLayout({ children, sideContent, showLogo = true }: AuthLayoutProps) {
    return (
        <div className="w-full h-screen lg:grid lg:grid-cols-2 overflow-hidden">

            {/* --- COLUNA ESQUERDA: BRANDING (Dark Blue with Image Placeholder) --- */}
            <div className="hidden lg:flex flex-col justify-between p-12 relative text-white bg-[#0A1A44] overflow-hidden">
                {/* Placeholder Gradient representing the sunset/drill vibe since image gen failed */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0A1A44] via-[#0f255e] to-[#1e3a8a]" />

                {/* Overlay do reinforce content legibility */}
                <div className="absolute inset-0 bg-[#0A1A44]/60 backdrop-blur-[1px]" />

                {/* Header / Logo */}
                <div className="relative z-10 flex items-center gap-5">
                    {/* Increased Logo Size */}
                    <div className="relative h-16 w-16 bg-white/10 p-2 rounded-2xl backdrop-blur-sm border border-white/20 shadow-xl">
                        <Image src="/logo.png" alt="NoteDrill" fill className="object-contain p-1" />
                    </div>
                    <div className="flex flex-col leading-none gap-1">
                        <span className="text-4xl font-extrabold tracking-tight text-white drop-shadow-md">NoteDrill</span>
                        <span className="text-sm uppercase opacity-90 tracking-[0.2em] font-bold text-blue-200">Portal do Cliente</span>
                    </div>
                </div>

                {/* Main Side Content */}
                <div className="relative z-10 max-w-lg mb-20 space-y-6">
                    {sideContent}
                </div>

                {/* Footer */}
                <div className="relative z-10">
                    <div className="flex items-center gap-3 text-sm opacity-60 font-medium tracking-wide">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] border border-white/10">M</div>
                        MINERATTUM TECNOLOGIA E SISTEMAS
                    </div>
                </div>
            </div>

            {/* --- COLUNA DIREITA: FORMULÁRIO --- */}
            <div className="flex items-center justify-center p-8 bg-white overflow-y-auto">
                <div className="w-full max-w-[500px] space-y-10"> {/* Increased Max Width */}
                    {children}
                </div>
            </div>
        </div>
    )
}
