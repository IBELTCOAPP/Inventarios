"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Inicio" },
  { href: "/rollos", label: "Rollos" },
  { href: "/retales", label: "Retales" },
  { href: "/pedidos/nuevo", label: "Nuevo pedido" },
  { href: "/historial", label: "Historial" },
  { href: "/anchos", label: "Análisis de anchos" },
];

const NAV_MAESTROS = [
  { href: "/clientes", label: "Clientes" },
  { href: "/proveedores", label: "Proveedores" },
  { href: "/lineas", label: "Tipos de línea" },
  { href: "/operarios", label: "Operarios" },
];

function esActivo(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-wrap items-center justify-between gap-x-6 gap-y-1 text-sm">
      <div className="flex flex-wrap gap-1">
        {NAV.map((item) => {
          const activo = esActivo(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-2.5 py-1.5 font-medium transition ${
                activo
                  ? "bg-brand-50 text-brand-800"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-1 text-neutral-500">
        <span className="mr-1 text-xs font-medium uppercase tracking-wide text-neutral-400">Maestros:</span>
        {NAV_MAESTROS.map((item) => {
          const activo = esActivo(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-2.5 py-1.5 transition ${
                activo ? "bg-brand-50 text-brand-800 font-medium" : "hover:bg-neutral-50 hover:text-neutral-950"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
