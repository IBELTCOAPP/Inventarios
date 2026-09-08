"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cerrarSesion } from "@/app/logout/actions";
import { PAGINAS, puedeVerPaginaClave, ROL_LABEL, type PaginaKey, type Rol } from "@/lib/pages";

const NAV_KEYS = ["rollos", "retales", "pedidos", "historial", "anchos", "planeacion"] as const;
const NAV_MAESTROS_KEYS = ["clientes", "proveedores", "lineas", "operarios"] as const;

function esActivo(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

function porClave(key: string) {
  return PAGINAS.find((p) => p.key === key)!;
}

export function Sidebar({
  nombre,
  rol,
  paginasPermitidas,
}: {
  nombre: string;
  rol: string;
  paginasPermitidas: string[];
}) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  // Cierra el panel móvil solo al cambiar de página (no en el primer render).
  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  const puedeVer = (key: string) => puedeVerPaginaClave(rol, paginasPermitidas, key as PaginaKey);
  const nav = NAV_KEYS.filter(puedeVer).map(porClave);
  const navMaestros = NAV_MAESTROS_KEYS.filter(puedeVer).map(porClave);
  const puedeAdministracion = puedeVer("usuarios");

  function Item({ href, label, icon }: { href: string; label: string; icon: string }) {
    const activo = esActivo(pathname, href);
    return (
      <Link
        href={href}
        className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition ${
          activo ? "bg-white font-medium text-brand-800 shadow-sm" : "text-brand-100 hover:bg-brand-700/60 hover:text-white"
        }`}
      >
        <span className="w-5 shrink-0 text-center">{icon}</span>
        {label}
      </Link>
    );
  }

  return (
    <>
      {/* Barra superior compacta, solo en móvil — abre el panel lateral. */}
      <div className="flex items-center gap-3 border-b border-brand-100 bg-white px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          className="rounded-md p-1.5 text-brand-800 hover:bg-brand-50"
        >
          <span className="block text-xl leading-none">☰</span>
        </button>
        <Image src="/logo-ibeltco.jpg" alt="IBELTCO" width={281} height={105} className="h-7 w-auto" priority />
      </div>

      {abierto && (
        <div className="fixed inset-0 z-30 bg-neutral-900/40 lg:hidden" onClick={() => setAbierto(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-brand-800 transition-transform duration-200 lg:translate-x-0 ${
          abierto ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-4 pb-2 pt-5">
          <div className="inline-block rounded-lg bg-white p-2 shadow-sm">
            <Image src="/logo-ibeltco.jpg" alt="IBELTCO" width={281} height={105} className="h-8 w-auto" priority />
          </div>
          <p className="mt-3 text-sm font-medium text-white">Inventario de Rollos</p>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-3">
          <div className="space-y-0.5">
            <Item href="/" label="Inicio" icon="🏠" />
            {nav.map((item) => (
              <Item key={item.key} href={item.href} label={item.label} icon={item.icon} />
            ))}
          </div>

          {navMaestros.length > 0 && (
            <div className="space-y-0.5">
              <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-brand-300">Maestros</p>
              {navMaestros.map((item) => (
                <Item key={item.key} href={item.href} label={item.label} icon={item.icon} />
              ))}
            </div>
          )}

          {puedeAdministracion && (
            <div className="space-y-0.5">
              <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-brand-300">Administración</p>
              <Item href="/usuarios" label="Usuarios" icon="👤" />
            </div>
          )}
        </nav>

        <div className="space-y-0.5 border-t border-brand-700 px-3 py-3">
          <p className="truncate px-3 text-xs text-brand-300">
            {nombre} · {ROL_LABEL[rol as Rol] ?? rol}
          </p>
          <Link href="/manual" className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-brand-100 hover:bg-brand-700/60 hover:text-white">
            <span className="w-5 shrink-0 text-center">📖</span>
            Manual
          </Link>
          <Link href="/cambiar-password" className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-brand-100 hover:bg-brand-700/60 hover:text-white">
            <span className="w-5 shrink-0 text-center">⚙️</span>
            Mi cuenta
          </Link>
          <form action={cerrarSesion}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-brand-100 hover:bg-brand-700/60 hover:text-white"
            >
              <span className="w-5 shrink-0 text-center">🚪</span>
              Salir
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
