"use client";

import { useState, useTransition } from "react";

/**
 * Tabla + formulario genérico de alta/edición/baja para un maestro simple
 * (Operarios, Líneas, Clientes, Proveedores). Los 4 maestros comparten la
 * misma forma: una lista de registros con `id`, algunos campos de texto, y
 * un `estado` Activo/Inactivo — así que un solo componente configurable
 * evita repetir 4 veces la misma tabla con botones de editar/eliminar.
 */

export type CampoMaestro = {
  key: string;
  label: string;
  requerido?: boolean;
  maxLength?: number;
  mayusculas?: boolean; // fuerza mayúsculas al escribir (usado para la letra de cliente)
  placeholder?: string;
};

export type RegistroMaestro = { id: number; estado: string; [key: string]: string | number | null };

export function MaestroCrud({
  campos,
  columnasTabla,
  registros,
  onGuardar,
  onEliminar,
  nombreEntidad,
}: {
  campos: CampoMaestro[];
  columnasTabla: { key: string; label: string }[];
  registros: RegistroMaestro[];
  // Firma laxa a propósito: cada maestro concreto (Operarios, Líneas, Clientes,
  // Proveedores) exige campos obligatorios distintos en su server action, y
  // este componente genérico solo puede garantizar en tiempo de ejecución
  // (no de tipos) que el formulario los llena antes de enviar.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onGuardar: (input: any) => Promise<{ ok: true } | { ok: false; error: string }>;
  onEliminar: (id: number) => Promise<{ ok: true } | { ok: false; error: string }>;
  nombreEntidad: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const vacio = Object.fromEntries(campos.map((c) => [c.key, ""]));
  const [form, setForm] = useState<Record<string, string>>({ ...vacio, estado: "Activo" });

  function empezarEdicion(r: RegistroMaestro) {
    setEditId(r.id);
    setError(null);
    const nuevo: Record<string, string> = { estado: String(r.estado) };
    for (const c of campos) nuevo[c.key] = String(r[c.key] ?? "");
    setForm(nuevo);
  }

  function cancelarEdicion() {
    setEditId(null);
    setForm({ ...vacio, estado: "Activo" });
    setError(null);
  }

  function guardar() {
    setError(null);
    startTransition(async () => {
      const res = await onGuardar(editId ? { ...form, id: editId } : form);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      cancelarEdicion();
    });
  }

  function eliminar(id: number) {
    if (!confirm(`¿Retirar este ${nombreEntidad} del maestro?`)) return;
    startTransition(async () => {
      await onEliminar(id);
      if (editId === id) cancelarEdicion();
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 card p-5 sm:grid-cols-2">
        {campos.map((c) => (
          <label key={c.key} className="block text-sm">
            <span className="mb-1 block text-neutral-600">
              {c.label}
              {c.requerido ? " *" : ""}
            </span>
            <input
              className="input"
              value={form[c.key] ?? ""}
              maxLength={c.maxLength}
              placeholder={c.placeholder}
              onChange={(e) => {
                const v = c.mayusculas ? e.target.value.toUpperCase() : e.target.value;
                setForm((f) => ({ ...f, [c.key]: v }));
              }}
            />
          </label>
        ))}
        <label className="block text-sm">
          <span className="mb-1 block text-neutral-600">Estado</span>
          <select
            className="input"
            value={form.estado}
            onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}
          >
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={guardar}
            disabled={isPending}
            className="btn-primary"
          >
            {isPending ? "Guardando..." : editId ? "Guardar cambios" : "Agregar"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={cancelarEdicion}
              disabled={isPending}
              className="btn-secondary"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-x-auto card">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              {columnasTabla.map((c) => (
                <th key={c.key} className="px-4 py-2 font-medium">
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {registros.map((r) => (
              <tr key={r.id} className="hover:bg-brand-50/60">
                {columnasTabla.map((c) => (
                  <td key={c.key} className="px-4 py-2">
                    {r[c.key] || "—"}
                  </td>
                ))}
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.estado === "Activo" ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-600"
                    }`}
                  >
                    {r.estado}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => empezarEdicion(r)}
                      className="link-brand"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminar(r.id)}
                      className="text-red-700 underline"
                    >
                      Retirar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {registros.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-neutral-400" colSpan={columnasTabla.length + 2}>
                  No hay registros todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
