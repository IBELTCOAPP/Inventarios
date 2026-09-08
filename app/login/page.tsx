export const dynamic = "force-dynamic";

import Image from "next/image";
import { redirect } from "next/navigation";
import { getUsuarioActual } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const usuario = await getUsuarioActual();
  if (usuario) redirect("/");

  return (
    <div className="mx-auto mt-12 max-w-sm space-y-6 px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <Image src="/logo-ibeltco.jpg" alt="IBELTCO" width={281} height={105} className="h-10 w-auto" priority />
        <div>
          <h1 className="text-lg font-semibold text-brand-950">Inventario de Rollos</h1>
          <p className="text-sm text-neutral-500">Inicia sesión con el correo y la contraseña que te dio el administrador.</p>
        </div>
      </div>
      <LoginForm />
    </div>
  );
}
