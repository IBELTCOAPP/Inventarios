import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
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
      <body className="min-h-full bg-neutral-50 text-neutral-900">
        {usuario ? (
          <>
            <Sidebar nombre={usuario.nombre} rol={usuario.rol} paginasPermitidas={usuario.paginasPermitidas} />
            <div className="flex min-h-full flex-col lg:pl-64">
              <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
              <footer className="border-t border-neutral-200 py-4 text-center text-xs text-neutral-400">
                IBELTCO S.A.S — Inventario de rollos
              </footer>
            </div>
          </>
        ) : (
          <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
        )}
      </body>
    </html>
  );
}
