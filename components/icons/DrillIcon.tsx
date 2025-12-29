import React from "react"
import { LucideProps } from "lucide-react"

export const DrillIcon = ({ className, ...props }: LucideProps) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...props}
        >
            {/* Tracks (Esteira) */}
            <path d="M2 17h12" />
            <path d="M2 17a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2" />
            <circle cx="4" cy="18" r="1" />
            <circle cx="12" cy="18" r="1" />

            {/* Body (Corpo) */}
            <path d="M5 17V9h6v8" />
            <path d="M7 12h2" />

            {/* Mast/Rig (Haste/Torre) */}
            <path d="M16 21V3" />
            <path d="M13 3h6" />
            <path d="M16 3l-2 2" />
            <path d="M16 3l2 2" />

            {/* Connection (Boom) */}
            <path d="M11 13h5" />
        </svg>
    )
}
