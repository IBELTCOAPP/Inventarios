import Link from "next/link";
import { requireUsuario } from "@/lib/auth";

export default async function SinAccesoPage() {
  await requireUsuario();

  return (
    <div className="mx-auto mt-12 max-w-md space-y-4 text-center">
      <div className="text-4xl">🔒</div>
      <h1 className="text-lg font-semibold text-brand-950">No tienes acceso a esta página</h1>
      <p className="text-sm text-neutral-600">
        Tu usuario no tiene permiso para ver esta sección. Si crees que deberías tenerlo, pídele a un
        administrador que te lo habilite en <Link href="/usuarios" className="link-brand">Usuarios</Link>.
      </p>
      <Link href="/" className="btn-primary inline-block">
        Volver al inicio
      </Link>
    </div>
  );
}
