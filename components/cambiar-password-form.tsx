"use client";

import { useState, useTransition } from "react";
import { cambiarMiPassword } from "@/app/cambiar-password/actions";

export function CambiarPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setListo(false);
    if (passwordNueva !== passwordConfirmar) {
      setError("La confirmación no coincide con la nueva contraseña.");
      return;
    }
    startTransition(async () => {
      const res = await cambiarMiPassword({ passwordActual, passwordNueva });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPasswordActual("");
      setPasswordNueva("");
      setPasswordConfirmar("");
      setListo(true);
    });
  }

  return (
    <form onSubmit={enviar} className="card max-w-sm space-y-4 p-6">
      <label className="block text-sm">
        <span className="mb-1 block text-neutral-600">Contraseña actual</span>
        <input className="input" type="password" value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} required />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-neutral-600">Contraseña nueva</span>
        <input className="input" type="password" value={passwordNueva} onChange={(e) => setPasswordNueva(e.target.value)} required minLength={8} />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-neutral-600">Confirmar contraseña nueva</span>
        <input className="input" type="password" value={passwordConfirmar} onChange={(e) => setPasswordConfirmar(e.target.value)} required minLength={8} />
      </label>
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {listo && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Contraseña actualizada.
        </div>
      )}
      <button type="submit" disabled={isPending} className="btn-primary w-full">
        {isPending ? "Guardando..." : "Cambiar contraseña"}
      </button>
    </form>
  );
}
