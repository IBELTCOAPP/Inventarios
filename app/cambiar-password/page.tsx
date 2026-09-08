export const dynamic = "force-dynamic";

import { requireUsuario } from "@/lib/auth";
import { CambiarPasswordForm } from "@/components/cambiar-password-form";

export default async function CambiarPasswordPage() {
  const usuario = await requireUsuario();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Mi cuenta</h1>
        <p className="text-sm text-neutral-600">
          {usuario.nombre} · {usuario.email}
        </p>
      </div>
      <CambiarPasswordForm />
    </div>
  );
}
