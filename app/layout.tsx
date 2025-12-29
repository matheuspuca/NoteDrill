import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Importante para o Tailwind funcionar

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "SmartDrill",
    description: "Sistema de Gestão de Perfuração e Desmonte",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-BR">
            <body className={inter.className}>
                {children}
            </body>
        </html>
    );
}
