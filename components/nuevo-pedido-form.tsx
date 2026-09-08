"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buscarDisponibilidad, confirmarCorte, type EstadoHistorico } from "@/app/pedidos/nuevo/actions";
import type { CandidatoCorte, PiezaRequerida } from "@/lib/cutting-engine";

type LineaReferencia = { linea: string; referencia: string };
type Cliente = { id: number; nombre: string; letra: string };

export function NuevoPedidoForm({
  opciones,
  clientes,
  operarios,
}: {
  opciones: LineaReferencia[];
  clientes: Cliente[];
  operarios: string[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [linea, setLinea] = useState("");
  const [referencia, setReferencia] = useState("");
  const [ancho, setAncho] = useState("");
  const [largo, setLargo] = useState("");

  const [pieza, setPieza] = useState<PiezaRequerida | null>(null);
  const [candidatos, setCandidatos] = useState<CandidatoCorte[] | null>(null);
  const [seleccion, setSeleccion] = useState<CandidatoCorte | null>(null);

  const [anchoFinal, setAnchoFinal] = useState("");
  const [largoFinal, setLargoFinal] = useState("");
  const [xFinal, setXFinal] = useState("");
  const [yFinal, setYFinal] = useState("");

  const [clienteId, setClienteId] = useState("");
  const [numeroPedido, setNumeroPedido] = useState("");
  const [operario, setOperario] = useState("");
  const [estado, setEstado] = useState<EstadoHistorico>("VENDIDO");
  const [nota, setNota] = useState("");

  const [confirmado, setConfirmado] = useState<{ lote: string; pedidoCodigo: string } | null>(null);

  const referenciasDeLinea = [...new Set(opciones.filter((o) => o.linea === linea).map((o) => o.referencia))];
  const clienteElegido = clientes.find((c) => String(c.id) === clienteId) ?? null;
  const codigoPreview = clienteElegido && numeroPedido ? `${clienteElegido.letra}-${numeroPedido}` : null;

  function idCandidato(c: CandidatoCorte) {
    return c.tipo === "retal" ? `retal-${c.retalId}` : `rollo-${c.rolloId}`;
  }

  function elegirCandidato(c: CandidatoCorte, piezaBase: PiezaRequerida) {
    setSeleccion(c);
    setAnchoFinal(String(piezaBase.anchoMm));
    setLargoFinal(String(piezaBase.largoMm));
    setXFinal(String(c.xSugerido));
    setYFinal(String(c.ySugerido));
  }

  function buscar() {
    setError(null);
    setCandidatos(null);
    setSeleccion(null);
    setConfirmado(null);
    startTransition(async () => {
      const res = await buscarDisponibilidad({
        linea,
        referencia,
        anchoMm: Number(ancho),
        largoMm: Number(largo),
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPieza(res.pieza);
      setCandidatos(res.candidatos);
      elegirCandidato(res.candidatos[0], res.pieza);
    });
  }

  function confirmar() {
    if (!seleccion || !pieza || !clienteElegido) return;
    setError(null);
    startTransition(async () => {
      const res = await confirmarCorte({
        candidato: seleccion,
        linea: pieza.linea,
        referencia: pieza.referencia,
        anchoMm: Number(anchoFinal),
        largoMm: Number(largoFinal),
        xInicial: Number(xFinal),
        yInicial: Number(yFinal),
        clienteNombre: clienteElegido.nombre,
        clienteLetra: clienteElegido.letra,
        numeroPedido,
        operario,
        estado,
        nota,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setConfirmado({ lote: res.lote, pedidoCodigo: res.pedidoCodigo });
      router.refresh();
    });
  }

  const camposCompletos = !!clienteElegido && /^\d+$/.test(numeroPedido) && !!operario;

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
        <Field label="Ancho solicitado (mm)">
          <input className="input" type="number" min={0} value={ancho} onChange={(e) => setAncho(e.target.value)} />
        </Field>
        <Field label="Largo solicitado (mm)">
          <input className="input" type="number" min={0} value={largo} onChange={(e) => setLargo(e.target.value)} />
        </Field>
        <div className="flex items-end sm:col-span-2">
          <button
            type="button"
            onClick={buscar}
            disabled={isPending || !linea || !referencia || !ancho || !largo}
            className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {isPending ? "Buscando..." : "🔍 Buscar disponibilidad (rollos y retales)"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {candidatos && pieza && !confirmado && (
        <div className="space-y-4">
          <div>
            <h2 className="font-medium">Opciones disponibles (⭐ = sugerida, menor desperdicio)</h2>
            <p className="text-sm text-neutral-600">
              Elige la pieza — puedes cambiar la sugerencia si prefieres otro rollo o retal.
            </p>
          </div>
          <div className="space-y-2">
            {candidatos.map((c) => (
              <CandidatoOption
                key={idCandidato(c)}
                candidato={c}
                seleccionado={seleccion ? idCandidato(seleccion) === idCandidato(c) : false}
                onElegir={() => elegirCandidato(c, pieza)}
              />
            ))}
          </div>

          {seleccion && (
            <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50 p-5">
              <h3 className="font-medium text-blue-900">Coordenadas de corte (editable)</h3>
              <div className="grid gap-4 sm:grid-cols-4">
                <Field label="Ancho a cortar (mm)">
                  <input className="input" type="number" value={anchoFinal} onChange={(e) => setAnchoFinal(e.target.value)} />
                </Field>
                <Field label="Largo a cortar (mm)">
                  <input className="input" type="number" value={largoFinal} onChange={(e) => setLargoFinal(e.target.value)} />
                </Field>
                <Field label="X inicial (mm)">
                  <input className="input" type="number" value={xFinal} onChange={(e) => setXFinal(e.target.value)} />
                </Field>
                <Field label="Y inicial (mm)">
                  <input className="input" type="number" value={yFinal} onChange={(e) => setYFinal(e.target.value)} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Cliente">
                  <select className="input" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                    <option value="">Selecciona...</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.letra} — {c.nombre}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Número de pedido (solo números)">
                  <input
                    className="input"
                    inputMode="numeric"
                    value={numeroPedido}
                    onChange={(e) => setNumeroPedido(e.target.value.replace(/\D/g, ""))}
                    placeholder="Ej: 1234"
                  />
                </Field>
                <Field label="Operario">
                  <select className="input" value={operario} onChange={(e) => setOperario(e.target.value)}>
                    <option value="">Selecciona...</option>
                    {operarios.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {codigoPreview && (
                <div className="text-sm text-blue-900">
                  Código de pedido: <strong>{codigoPreview}</strong>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Estado resultante del corte">
                  <select className="input" value={estado} onChange={(e) => setEstado(e.target.value as EstadoHistorico)}>
                    <option value="VENDIDO">VENDIDO</option>
                    <option value="RETAL_UTIL">RETAL ÚTIL</option>
                    <option value="ELIMINADO">ELIMINADO</option>
                  </select>
                </Field>
                <Field label="Nota (opcional)">
                  <input className="input" value={nota} onChange={(e) => setNota(e.target.value)} />
                </Field>
              </div>

              <button
                type="button"
                onClick={confirmar}
                disabled={isPending || !camposCompletos}
                className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                title={!camposCompletos ? "Completa cliente, número de pedido y operario" : undefined}
              >
                {isPending ? "Confirmando..." : "Confirmar corte"}
              </button>
            </div>
          )}
        </div>
      )}

      {confirmado && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
          Corte del pedido <strong>{confirmado.pedidoCodigo}</strong> registrado sobre el lote{" "}
          <strong>{confirmado.lote}</strong>. Ya quedó en el historial e inventario actualizado.
        </div>
      )}
    </div>
  );
}

function CandidatoOption({
  candidato,
  seleccionado,
  onElegir,
}: {
  candidato: CandidatoCorte;
  seleccionado: boolean;
  onElegir: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onElegir}
      className={`block w-full rounded-lg border p-4 text-left transition ${
        seleccionado ? "border-emerald-400 bg-emerald-50" : "border-neutral-200 bg-white hover:border-neutral-400"
      }`}
    >
      {candidato.tipo === "retal" ? (
        <>
          <div className="flex items-center justify-between font-medium text-neutral-900">
            <span>✂️ Retal del lote {candidato.loteOrigen}</span>
            {candidato.sugerido && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">⭐ Sugerido</span>}
          </div>
          <p className="mt-1 text-sm text-neutral-600">
            Tamaño disponible: {candidato.anchoDisponible.toLocaleString("es-CO")} x{" "}
            {candidato.largoDisponible.toLocaleString("es-CO")} mm.
          </p>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between font-medium text-neutral-900">
            <span>🎞️ Rollo {candidato.lote}</span>
            {candidato.sugerido && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">⭐ Sugerido</span>}
          </div>
          <p className="mt-1 text-sm text-neutral-600">
            Ancho rollo: {candidato.anchoRollo.toLocaleString("es-CO")} mm · Disponible a lo largo:{" "}
            {candidato.largoDisponible.toLocaleString("es-CO")} mm · Posición sugerida X={candidato.xSugerido}, Y=
            {candidato.ySugerido}
            {candidato.abreFranjaNueva ? " (abre franja nueva)" : " (aprovecha franja abierta)"}.
          </p>
        </>
      )}
    </button>
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
