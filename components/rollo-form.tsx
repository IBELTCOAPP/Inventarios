"use client";

import { useState, useTransition } from "react";
import { guardarRollo, eliminarRollo } from "@/app/rollos/actions";

type Rollo = {
  id: number;
  lote: string;
  linea: string;
  referencia: string;
  anchoMm: number;
  largoMm: number;
  largoUsadoMm: number;
  proveedor: string | null;
  estado: string;
};

const ESTADO_STYLE: Record<string, string> = {
  INICIADO: "bg-amber-100 text-amber-800",
  COMPLETO: "bg-emerald-100 text-emerald-800",
  AGOTADO: "bg-neutral-200 text-neutral-600",
};

export function RolloForm({
  rollos,
  lineas,
  proveedores,
}: {
  rollos: Rollo[];
  lineas: string[];
  proveedores: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  const vacio = {
    lote: "",
    linea: "",
    referencia: "",
    anchoMm: "",
    largoMm: "",
    largoUsadoMm: "0",
    proveedor: "",
    estado: "INICIADO",
  };
  const [form, setForm] = useState(vacio);

  function empezarEdicion(r: Rollo) {
    setEditId(r.id);
    setError(null);
    setForm({
      lote: r.lote,
      linea: r.linea,
      referencia: r.referencia,
      anchoMm: String(r.anchoMm),
      largoMm: String(r.largoMm),
      largoUsadoMm: String(r.largoUsadoMm),
      proveedor: r.proveedor ?? "",
      estado: r.estado,
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
      const res = await guardarRollo({
        id: editId ?? undefined,
        lote: form.lote,
        linea: form.linea,
        referencia: form.referencia,
        anchoMm: Number(form.anchoMm),
        largoMm: Number(form.largoMm),
        largoUsadoMm: Number(form.largoUsadoMm) || 0,
        proveedor: form.proveedor,
        estado: form.estado,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      cancelar();
    });
  }

  function eliminar(id: number) {
    if (!confirm("¿Eliminar este rollo del inventario? Los cortes ya registrados no se eliminan.")) return;
    startTransition(async () => {
      await eliminarRollo(id);
      if (editId === id) cancelar();
    });
  }

  return (
    <div className="space-y-4">
      <details className="rounded-lg border border-neutral-200 bg-white" open={editId !== null}>
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-medium">
          {editId ? "Editar rollo" : "➕ Nuevo rollo"}
        </summary>
        <div className="grid gap-4 border-t border-neutral-200 p-5 sm:grid-cols-2">
          <Field label="Lote *">
            <input className="input" value={form.lote} onChange={(e) => setForm((f) => ({ ...f, lote: e.target.value }))} placeholder="Ej: PVC3B - R1" />
          </Field>
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
          <Field label="Proveedor">
            <select className="input" value={form.proveedor} onChange={(e) => setForm((f) => ({ ...f, proveedor: e.target.value }))}>
              <option value="">-- Ninguno --</option>
              {proveedores.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Ancho (mm) *">
            <input className="input" type="number" min={0} value={form.anchoMm} onChange={(e) => setForm((f) => ({ ...f, anchoMm: e.target.value }))} />
          </Field>
          <Field label="Largo total (mm) *">
            <input className="input" type="number" min={0} value={form.largoMm} onChange={(e) => setForm((f) => ({ ...f, largoMm: e.target.value }))} />
          </Field>
          <Field label="Largo ya usado (mm)">
            <input className="input" type="number" min={0} value={form.largoUsadoMm} onChange={(e) => setForm((f) => ({ ...f, largoUsadoMm: e.target.value }))} />
          </Field>
          <Field label="Estado">
            <select className="input" value={form.estado} onChange={(e) => setForm((f) => ({ ...f, estado: e.target.value }))}>
              <option value="INICIADO">INICIADO</option>
              <option value="COMPLETO">COMPLETO</option>
              <option value="AGOTADO">AGOTADO</option>
            </select>
          </Field>
          <div className="flex items-end gap-2 sm:col-span-2">
            <button
              type="button"
              onClick={guardar}
              disabled={isPending}
              className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
            >
              {isPending ? "Guardando..." : editId ? "Guardar cambios" : "Agregar rollo"}
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
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Lote</th>
              <th className="px-4 py-2 font-medium">Línea</th>
              <th className="px-4 py-2 font-medium">Referencia</th>
              <th className="px-4 py-2 font-medium">Ancho (mm)</th>
              <th className="px-4 py-2 font-medium">Largo total (mm)</th>
              <th className="px-4 py-2 font-medium">Largo usado (mm)</th>
              <th className="px-4 py-2 font-medium">Disponible (mm)</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rollos.map((r) => {
              const disponible = r.largoMm - r.largoUsadoMm;
              return (
                <tr key={r.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-2">
                    <a href={`/rollos/${encodeURIComponent(r.lote)}`} className="font-medium underline">
                      {r.lote}
                    </a>
                  </td>
                  <td className="px-4 py-2">{r.linea}</td>
                  <td className="px-4 py-2">{r.referencia}</td>
                  <td className="px-4 py-2">{r.anchoMm.toLocaleString("es-CO")}</td>
                  <td className="px-4 py-2">{r.largoMm.toLocaleString("es-CO")}</td>
                  <td className="px-4 py-2">{r.largoUsadoMm.toLocaleString("es-CO")}</td>
                  <td className="px-4 py-2">{disponible.toLocaleString("es-CO")}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_STYLE[r.estado] ?? "bg-neutral-100"}`}>
                      {r.estado}
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
              );
            })}
            {rollos.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-neutral-400" colSpan={9}>
                  No hay rollos registrados todavía.
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
