"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PAGINAS, puedeVerPaginaClave } from "@/lib/pages";

const NAV_KEYS = ["rollos", "retales", "pedidos", "historial", "anchos", "planeacion"] as const;
const NAV_MAESTROS_KEYS = ["clientes", "proveedores", "lineas", "operarios"] as const;

function esActivo(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function SiteNav({ rol, paginasPermitidas }: { rol: string; paginasPermitidas: string[] }) {
  const pathname = usePathname();

  const puedeVer = (key: string) => puedeVerPaginaClave(rol, paginasPermitidas, key as (typeof PAGINAS)[number]["key"]);
  const porClave = (key: string) => PAGINAS.find((p) => p.key === key)!;

  const nav = [{ key: "inicio", label: "Inicio", href: "/" }, ...NAV_KEYS.filter(puedeVer).map((k) => porClave(k))];
  const navMaestros = NAV_MAESTROS_KEYS.filter(puedeVer).map((k) => porClave(k));
  const puedeAdministracion = puedeVer("usuarios");

  return (
    <nav className="flex flex-1 flex-wrap items-center justify-between gap-x-6 gap-y-1 text-sm">
      <div className="flex flex-wrap gap-1">
        {nav.map((item) => {
          const activo = esActivo(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-2.5 py-1.5 font-medium transition ${
                activo ? "bg-brand-50 text-brand-800" : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      {(navMaestros.length > 0 || puedeAdministracion) && (
        <div className="flex flex-wrap items-center gap-1 text-neutral-500">
          {navMaestros.length > 0 && (
            <>
              <span className="mr-1 text-xs font-medium uppercase tracking-wide text-neutral-400">Maestros:</span>
              {navMaestros.map((item) => {
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
            </>
          )}
          {puedeAdministracion && (
            <Link
              href="/usuarios"
              className={`rounded-md px-2.5 py-1.5 transition ${
                esActivo(pathname, "/usuarios") ? "bg-brand-50 text-brand-800 font-medium" : "hover:bg-neutral-50 hover:text-neutral-950"
              }`}
            >
              👤 Usuarios
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
