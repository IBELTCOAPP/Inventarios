"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buscarSugerencia, confirmarCorte } from "@/app/pedidos/nuevo/actions";
import type { SugerenciaCorte, PiezaRequerida } from "@/lib/cutting-engine";

type LineaReferencia = { linea: string; referencia: string };

export function NuevoPedidoForm({ opciones }: { opciones: LineaReferencia[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{
    sugerencia: SugerenciaCorte;
    pieza: PiezaRequerida;
  } | null>(null);
  const [confirmado, setConfirmado] = useState<string | null>(null);

  const [linea, setLinea] = useState("");
  const [referencia, setReferencia] = useState("");
  const [ancho, setAncho] = useState("");
  const [largo, setLargo] = useState("");
  const [cliente, setCliente] = useState("");
  const [pedidoTaller, setPedidoTaller] = useState("");
  const [operario, setOperario] = useState("");

  const referenciasDeLinea = [...new Set(opciones.filter((o) => o.linea === linea).map((o) => o.referencia))];

  function buscar() {
    setError(null);
    setResultado(null);
    setConfirmado(null);
    startTransition(async () => {
      const res = await buscarSugerencia({
        linea,
        referencia,
        anchoMm: Number(ancho),
        largoMm: Number(largo),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResultado({ sugerencia: res.sugerencia, pieza: res.pieza });
    });
  }

  function confirmar() {
    if (!resultado) return;
    setError(null);
    startTransition(async () => {
      const res = await confirmarCorte({
        sugerencia: resultado.sugerencia,
        pieza: resultado.pieza,
        cliente,
        pedidoTaller,
        operario,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setConfirmado(res.lote);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-5 sm:grid-cols-2">
        <Field label="Línea">
          <select
            className="input"
            value={linea}
            onChange={(e) => {
              setLinea(e.target.value);
              setReferencia("");
            }}
          >
            <option value="">Selecciona...</option>
            {[...new Set(opciones.map((o) => o.linea))].map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Referencia">
          <select
            className="input"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            disabled={!linea}
          >
            <option value="">Selecciona...</option>
            {referenciasDeLinea.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ancho requerido (mm)">
          <input className="input" type="number" min={0} value={ancho} onChange={(e) => setAncho(e.target.value)} />
        </Field>
        <Field label="Largo requerido (mm)">
          <input className="input" type="number" min={0} value={largo} onChange={(e) => setLargo(e.target.value)} />
        </Field>
        <Field label="Cliente">
          <input className="input" value={cliente} onChange={(e) => setCliente(e.target.value)} />
        </Field>
        <Field label="No. Pedido taller">
          <input className="input" value={pedidoTaller} onChange={(e) => setPedidoTaller(e.target.value)} />
        </Field>
        <Field label="Operario">
          <input className="input" value={operario} onChange={(e) => setOperario(e.target.value)} />
        </Field>
        <div className="flex items-end">
          <button
            type="button"
            onClick={buscar}
            disabled={isPending || !linea || !referencia || !ancho || !largo}
            className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {isPending ? "Buscando..." : "Buscar dónde cortar"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {resultado && (
        <SugerenciaCard
          sugerencia={resultado.sugerencia}
          pieza={resultado.pieza}
          onConfirmar={confirmar}
          confirmado={confirmado}
          isPending={isPending}
          camposCompletos={!!cliente && !!pedidoTaller && !!operario}
        />
      )}
    </div>
  );
}

function SugerenciaCard({
  sugerencia,
  pieza,
  onConfirmar,
  confirmado,
  isPending,
  camposCompletos,
}: {
  sugerencia: SugerenciaCorte;
  pieza: PiezaRequerida;
  onConfirmar: () => void;
  confirmado: string | null;
  isPending: boolean;
  camposCompletos: boolean;
}) {
  if (sugerencia.tipo === "sin_material") {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        No hay rollo ni retal disponible de <strong>{pieza.referencia}</strong> con ancho suficiente
        para {pieza.anchoMm} x {pieza.largoMm} mm. Hay que importar o abrir un rollo nuevo de esta
        referencia.
      </div>
    );
  }

  if (confirmado) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
        Corte registrado sobre el lote <strong>{confirmado}</strong>. Ya quedó en el historial e
        inventario actualizado.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
      {sugerencia.tipo === "retal" ? (
        <>
          <div className="font-medium text-blue-900">Cortar de un retal disponible</div>
          <p className="mt-1 text-sm text-blue-800">
            Retal del lote <strong>{sugerencia.loteOrigen}</strong>. Usa el retal completo para esta
            pieza de {pieza.anchoMm} x {pieza.largoMm} mm.
            {sugerencia.sobranteAnchoMm > 0 || sugerencia.sobranteLargoMm > 0 ? (
              <>
                {" "}
                Sobra material reutilizable (
                {sugerencia.sobranteAnchoMm > 0 && `${sugerencia.sobranteAnchoMm} mm de ancho`}
                {sugerencia.sobranteAnchoMm > 0 && sugerencia.sobranteLargoMm > 0 && " y "}
                {sugerencia.sobranteLargoMm > 0 && `${sugerencia.sobranteLargoMm} mm de largo`}) — se
                registra automáticamente como retal nuevo al confirmar.
              </>
            ) : (
              " El retal se agota por completo con este corte."
            )}
          </p>
        </>
      ) : (
        <>
          <div className="font-medium text-blue-900">Cortar del rollo {sugerencia.lote}</div>
          <p className="mt-1 text-sm text-blue-800">
            Posición exacta: <strong>X = {sugerencia.xInicial} mm, Y = {sugerencia.yInicial} mm</strong>{" "}
            (midiendo desde la esquina inicial del rollo). Pieza de {pieza.anchoMm} x {pieza.largoMm} mm.
            {sugerencia.abreFranjaNueva
              ? " Se abre una franja nueva al final de lo ya cortado."
              : " Se aprovecha espacio libre dentro de una franja ya abierta."}
          </p>
        </>
      )}
      <button
        type="button"
        onClick={onConfirmar}
        disabled={isPending || !camposCompletos}
        className="mt-4 rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        title={!camposCompletos ? "Completa cliente, pedido de taller y operario para confirmar" : undefined}
      >
        {isPending ? "Confirmando..." : "Confirmar corte"}
      </button>
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
