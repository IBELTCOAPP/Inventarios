import Link from "next/link";
import { cerrarSesion } from "@/app/logout/actions";
import { ROL_LABEL, type Rol } from "@/lib/pages";

export function UserBadge({ nombre, rol }: { nombre: string; rol: string }) {
  return (
    <div className="flex items-center gap-3 whitespace-nowrap text-sm text-neutral-500">
      <Link href="/manual" className="rounded-md px-2 py-1.5 hover:bg-neutral-50 hover:text-neutral-950" title="Manual de usuario">
        📖 Manual
      </Link>
      <span className="hidden text-xs text-neutral-400 sm:inline">
        {nombre} · {ROL_LABEL[rol as Rol] ?? rol}
      </span>
      <Link href="/cambiar-password" className="rounded-md px-2 py-1.5 hover:bg-neutral-50 hover:text-neutral-950">
        Mi cuenta
      </Link>
      <form action={cerrarSesion}>
        <button type="submit" className="rounded-md px-2 py-1.5 hover:bg-neutral-50 hover:text-neutral-950">
          Salir
        </button>
      </form>
    </div>
  );
}
