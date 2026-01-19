import { Button } from "@/components/ui/button"
import { Edit, Trash2, Printer, Loader2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface UnifiedActionButtonsProps {
    onEdit?: () => void
    editLink?: string
    onDelete?: (e: React.MouseEvent) => void
    onPrint?: (e: React.MouseEvent) => void
    isPrinting?: boolean
    children?: React.ReactNode
    className?: string
}

export function UnifiedActionButtons({
    onEdit,
    editLink,
    onDelete,
    onPrint,
    isPrinting = false,
    children,
    className
}: UnifiedActionButtonsProps) {
    return (
        <div className={cn("flex items-center justify-end gap-2", className)} onClick={(e) => e.stopPropagation()}>
            {onPrint && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg font-bold gap-2"
                    onClick={onPrint}
                    disabled={isPrinting}
                    title="Imprimir"
                >
                    {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
                    <span className="hidden lg:inline">Imprimir</span>
                </Button>
            )}

            {children}

            {editLink ? (
                <Link href={editLink}>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-bold gap-2"
                    >
                        <Edit className="h-4 w-4" />
                        <span className="hidden md:inline">Editar</span>
                    </Button>
                </Link>
            ) : onEdit ? (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg font-bold gap-2"
                    onClick={(e) => {
                        e.stopPropagation()
                        onEdit()
                    }}
                >
                    <Edit className="h-4 w-4" />
                    <span className="hidden md:inline">Editar</span>
                </Button>
            ) : null}

            {onDelete && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg font-bold gap-2"
                    onClick={onDelete}
                >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden md:inline">Excluir</span>
                </Button>
            )}
        </div>
    )
}
