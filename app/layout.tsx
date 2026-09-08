import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import { UserBadge } from "@/components/user-badge";
import { getUsuarioActual } from "@/lib/auth";
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const usuario = await getUsuarioActual();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        <header className="border-b border-brand-100 bg-white shadow-sm shadow-neutral-900/[0.03]">
          <div className="h-1 bg-gradient-to-r from-brand-600 via-brand-500 to-brand-300" />
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
            <Link href={usuario ? "/" : "/login"} className="flex items-center">
              <Image
                src="/logo-ibeltco.jpg"
                alt="IBELTCO"
                width={281}
                height={105}
                className="h-8 w-auto"
                priority
              />
            </Link>
            {usuario ? (
              <>
                <SiteNav rol={usuario.rol} paginasPermitidas={usuario.paginasPermitidas} />
                <UserBadge nombre={usuario.nombre} rol={usuario.rol} />
              </>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t border-neutral-200 bg-white py-4 text-center text-xs text-neutral-400">
          IBELTCO S.A.S — Inventario de rollos
        </footer>
      </body>
    </html>
  );
}
