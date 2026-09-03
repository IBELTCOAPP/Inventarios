import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ibelco · Inventario de Rollos",
  description: "Inventario, retales y plano de corte de Importadora de correas colombiana SAS",
};

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/rollos", label: "Rollos" },
  { href: "/retales", label: "Retales" },
  { href: "/pedidos/nuevo", label: "Nuevo pedido" },
  { href: "/historial", label: "Historial" },
  { href: "/anchos", label: "Análisis de anchos" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
            <Link href="/" className="font-semibold tracking-tight">
              IBELTCO <span className="font-normal text-neutral-500">· Inventario</span>
            </Link>
            <nav className="flex gap-4 text-sm text-neutral-600">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="hover:text-neutral-950">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
