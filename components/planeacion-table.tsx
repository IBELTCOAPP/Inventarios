"use client";

import { useState, useTransition } from "react";
import { guardarPolitica } from "@/app/planeacion/actions";
import { calcularPolitica, type ResultadoPolitica } from "@/lib/inventory-policy";
import type { FilaPlaneacion } from "@/lib/planeacion";

const ESTADO_STYLE: Record<ResultadoPolitica["estado"], string> = {
  REORDENAR: "bg-red-100 text-red-800",
  OK: "bg-emerald-100 text-emerald-800",
  SIN_DEMANDA: "bg-neutral-200 text-neutral-600",
};

const ESTADO_LABEL: Record<ResultadoPolitica["estado"], string> = {
  REORDENAR: "⚠️ Reordenar",
  OK: "✓ OK",
  SIN_DEMANDA: "Sin demanda",
};

function fmt(n: number, decimales = 1) {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("es-CO", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
}

export function PlaneacionTable({ filas }: { filas: FilaPlaneacion[] }) {
  return (
    <div className="overflow-x-auto card">
      <table className="w-full min-w-[1180px] text-sm">
        <thead className="bg-neutral-50 text-left text-neutral-500">
          <tr>
            <th className="px-4 py-2 font-medium">Línea</th>
            <th className="px-4 py-2 font-medium">Referencia</th>
            <th className="px-4 py-2 font-medium">Demanda diaria (m²)</th>
            <th className="px-4 py-2 font-medium">Stock actual (m²)</th>
            <th className="px-4 py-2 font-medium">Días de cobertura</th>
            <th className="px-4 py-2 font-medium">Lead time (días)</th>
            <th className="px-4 py-2 font-medium">Cobertura objetivo (días)</th>
            <th className="px-4 py-2 font-medium">Stock seguridad (m²)</th>
            <th className="px-4 py-2 font-medium">Punto de reorden (m²)</th>
            <th className="px-4 py-2 font-medium">Nivel objetivo (m²)</th>
            <th className="px-4 py-2 font-medium">Pedir ahora (m²)</th>
            <th className="px-4 py-2 font-medium">Estado</th>
            <th className="px-4 py-2 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {filas.map((f) => (
            <FilaEditable key={`${f.linea}|||${f.referencia}`} fila={f} />
          ))}
          {filas.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-center text-neutral-400" colSpan={13}>
                No hay referencias con historia de rollos, retales o cortes todavía.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function FilaEditable({ fila }: { fila: FilaPlaneacion }) {
  const [isPending, startTransition] = useTransition();
  const [leadTimeDias, setLeadTimeDias] = useState(fila.leadTimeDias);
  const [diasCoberturaObjetivo, setDiasCoberturaObjetivo] = useState(fila.diasCoberturaObjetivo);
  const [stockSeguridadM2, setStockSeguridadM2] = useState(fila.stockSeguridadM2);
  const [guardado, setGuardado] = useState(false);

  // Recalcula en vivo con lo que el usuario va escribiendo, antes de guardar
  // — así ve de inmediato el efecto de mover el lead time o la cobertura.
  const resultado = calcularPolitica({
    stockActualM2: fila.stockActualM2,
    demandaDiariaM2: fila.demandaDiariaM2,
    leadTimeDias,
    diasCoberturaObjetivo,
    stockSeguridadM2,
  });

  const huboCambios =
    leadTimeDias !== fila.leadTimeDias ||
    diasCoberturaObjetivo !== fila.diasCoberturaObjetivo ||
    stockSeguridadM2 !== fila.stockSeguridadM2;

  function guardar() {
    setGuardado(false);
    startTransition(async () => {
      await guardarPolitica({
        linea: fila.linea,
        referencia: fila.referencia,
        leadTimeDias,
        diasCoberturaObjetivo,
        stockSeguridadM2,
      });
      setGuardado(true);
    });
  }

  return (
    <tr className={`hover:bg-brand-50/60 ${resultado.estado === "REORDENAR" ? "bg-red-50/60" : ""}`}>
      <td className="px-4 py-2">{fila.linea}</td>
      <td className="px-4 py-2 font-medium">{fila.referencia}</td>
      <td className="px-4 py-2">{fmt(fila.demandaDiariaM2, 2)}</td>
      <td className="px-4 py-2">{fmt(fila.stockActualM2)}</td>
      <td className="px-4 py-2">{Number.isFinite(resultado.diasCobertura) ? fmt(resultado.diasCobertura, 0) : "—"}</td>
      <td className="px-2 py-1">
        <input
          type="number"
          min={0}
          className="input w-20"
          value={leadTimeDias}
          onChange={(e) => setLeadTimeDias(Number(e.target.value) || 0)}
        />
      </td>
      <td className="px-2 py-1">
        <input
          type="number"
          min={0}
          className="input w-24"
          value={diasCoberturaObjetivo}
          onChange={(e) => setDiasCoberturaObjetivo(Number(e.target.value) || 0)}
        />
      </td>
      <td className="px-2 py-1">
        <input
          type="number"
          min={0}
          step="0.1"
          className="input w-20"
          value={stockSeguridadM2}
          onChange={(e) => setStockSeguridadM2(Number(e.target.value) || 0)}
        />
      </td>
      <td className="px-4 py-2">{fmt(resultado.puntoReordenM2)}</td>
      <td className="px-4 py-2">{fmt(resultado.nivelObjetivoM2)}</td>
      <td className="px-4 py-2 font-medium">{resultado.cantidadSugeridaM2 > 0 ? fmt(resultado.cantidadSugeridaM2) : "—"}</td>
      <td className="px-4 py-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_STYLE[resultado.estado]}`}>
          {ESTADO_LABEL[resultado.estado]}
        </span>
      </td>
      <td className="px-2 py-1">
        {huboCambios && (
          <button type="button" onClick={guardar} disabled={isPending} className="btn-secondary px-2 py-1 text-xs">
            {isPending ? "..." : "Guardar"}
          </button>
        )}
        {!huboCambios && guardado && <span className="text-xs text-emerald-700">✓ Guardado</span>}
      </td>
    </tr>
  );
}
