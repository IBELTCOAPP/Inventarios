"use client";

import { useState, useTransition } from "react";
import { guardarRetal, eliminarRetal } from "@/app/retales/actions";

type Retal = {
  id: number;
  loteOrigen: string;
  linea: string;
  referencia: string;
  anchoMm: number;
  largoMm: number;
  disponible: boolean;
};

export function RetalForm({ retales, lineas }: { retales: Retal[]; lineas: string[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  const vacio = { loteOrigen: "", linea: "", referencia: "", anchoMm: "", largoMm: "", disponible: "true" };
  const [form, setForm] = useState(vacio);

  function empezarEdicion(r: Retal) {
    setEditId(r.id);
    setError(null);
    setForm({
      loteOrigen: r.loteOrigen,
      linea: r.linea,
      referencia: r.referencia,
      anchoMm: String(r.anchoMm),
      largoMm: String(r.largoMm),
      disponible: String(r.disponible),
    });
  }

  function cancelar() {
    setEditId(null);
    setForm(vacio);
    setError(null);
  }

  function guardar() {
    setError(null);
    startTransition(async () => {
      const res = await guardarRetal({
        id: editId ?? undefined,
        loteOrigen: form.loteOrigen,
        linea: form.linea,
        referencia: form.referencia,
        anchoMm: Number(form.anchoMm),
        largoMm: Number(form.largoMm),
        disponible: form.disponible === "true",
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      cancelar();
    });
  }

  function eliminar(id: number) {
    if (!confirm("¿Eliminar esta pieza de retal? No se puede deshacer.")) return;
    startTransition(async () => {
      await eliminarRetal(id);
      if (editId === id) cancelar();
    });
  }

  return (
    <div className="space-y-4">
      <details className="rounded-lg border border-neutral-200 bg-white" open={editId !== null}>
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-medium">
          {editId ? "Editar retal" : "➕ Registrar retal manual"}
        </summary>
        <div className="grid gap-4 border-t border-neutral-200 p-5 sm:grid-cols-2">
          <Field label="Línea *">
            <select className="input" value={form.linea} onChange={(e) => setForm((f) => ({ ...f, linea: e.target.value }))}>
              <option value="">Selecciona...</option>
              {lineas.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="Referencia">
            <input className="input" value={form.referencia} onChange={(e) => setForm((f) => ({ ...f, referencia: e.target.value }))} />
          </Field>
          <Field label="Lote de origen (opcional)">
            <input className="input" value={form.loteOrigen} onChange={(e) => setForm((f) => ({ ...f, loteOrigen: e.target.value }))} placeholder="Deja vacío si es un retal suelto" />
          </Field>
          <Field label="Disponible">
            <select className="input" value={form.disponible} onChange={(e) => setForm((f) => ({ ...f, disponible: e.target.value }))}>
              <option value="true">Sí</option>
              <option value="false">No</option>
            </select>
          </Field>
          <Field label="Ancho (mm) *">
            <input className="input" type="number" min={0} value={form.anchoMm} onChange={(e) => setForm((f) => ({ ...f, anchoMm: e.target.value }))} />
          </Field>
          <Field label="Largo (mm) *">
            <input className="input" type="number" min={0} value={form.largoMm} onChange={(e) => setForm((f) => ({ ...f, largoMm: e.target.value }))} />
          </Field>
          <div className="flex items-end gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={guardar}
              disabled={isPending}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {isPending ? "Guardando..." : editId ? "Guardar cambios" : "Agregar retal"}
            </button>
            {editId && (
              <button type="button" onClick={cancelar} disabled={isPending} className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700">
                Cancelar
              </button>
            )}
          </div>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">
              {error}
            </div>
          )}
        </div>
      </details>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Lote origen</th>
              <th className="px-4 py-2 font-medium">Línea</th>
              <th className="px-4 py-2 font-medium">Referencia</th>
              <th className="px-4 py-2 font-medium">Ancho (mm)</th>
              <th className="px-4 py-2 font-medium">Largo (mm)</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {retales.map((r) => (
              <tr key={r.id} className="hover:bg-neutral-50">
                <td className="px-4 py-2 font-medium">{r.loteOrigen}</td>
                <td className="px-4 py-2">{r.linea}</td>
                <td className="px-4 py-2">{r.referencia}</td>
                <td className="px-4 py-2">{r.anchoMm.toLocaleString("es-CO")}</td>
                <td className="px-4 py-2">{r.largoMm.toLocaleString("es-CO")}</td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.disponible ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-600"}`}>
                    {r.disponible ? "DISPONIBLE" : "AGOTADO"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => empezarEdicion(r)} className="text-blue-700 underline">
                      Editar
                    </button>
                    <button type="button" onClick={() => eliminar(r.id)} className="text-red-700 underline">
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {retales.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-neutral-400" colSpan={7}>
                  No hay retales registrados todavía. Se generan al confirmar un corte con sobrante,
                  o los agregas manualmente aquí.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-neutral-600">{label}</span>
      {children}
    </label>
  );
}
