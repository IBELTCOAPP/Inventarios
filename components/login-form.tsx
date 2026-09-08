"use client";

import { useState, useTransition } from "react";
import { iniciarSesion } from "@/app/login/actions";

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await iniciarSesion({ email, password });
      // Si fue exitoso, iniciarSesion ya redirigió a "/" del lado del
      // servidor — solo llegamos aquí cuando falló.
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <form onSubmit={enviar} className="card space-y-4 p-6">
      <label className="block text-sm">
        <span className="mb-1 block text-neutral-600">Correo</span>
        <input
          className="input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block text-neutral-600">Contraseña</span>
        <input
          className="input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      <button type="submit" disabled={isPending} className="btn-primary w-full">
        {isPending ? "Entrando..." : "Iniciar sesión"}
      </button>
    </form>
  );
}
