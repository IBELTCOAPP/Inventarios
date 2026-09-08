export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getRolloPorLote, getCortesPorLote } from "@/lib/db/queries";
import { PlanoDeCorte } from "@/components/plano-de-corte";
import { requireUsuario } from "@/lib/auth";

export default async function RolloDetallePage({
  params,
}: PageProps<"/rollos/[lote]">) {
  await requireUsuario("rollos");
  const { lote: loteParam } = await params;
  const lote = decodeURIComponent(loteParam);
  const rollo = await getRolloPorLote(lote);
  if (!rollo) notFound();

  const cortesDelRollo = await getCortesPorLote(lote);
  const disponible = rollo.largoMm - rollo.largoUsadoMm;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{rollo.lote}</h1>
        <p className="text-sm text-neutral-600">
          {rollo.linea} · {rollo.referencia}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Ancho" value={`${rollo.anchoMm.toLocaleString("es-CO")} mm`} />
        <Stat label="Largo total" value={`${rollo.largoMm.toLocaleString("es-CO")} mm`} />
        <Stat label="Largo usado" value={`${rollo.largoUsadoMm.toLocaleString("es-CO")} mm`} />
        <Stat label="Disponible" value={`${disponible.toLocaleString("es-CO")} mm`} />
      </div>

      <div className="card p-4">
        <h2 className="mb-3 font-medium">Plano de corte</h2>
        <PlanoDeCorte
          anchoRollo={rollo.anchoMm}
          largoRollo={rollo.largoMm}
          largoUsado={rollo.largoUsadoMm}
          cortes={cortesDelRollo.map((c) => ({
            id: c.id,
            xInicial: c.xInicial,
            yInicial: c.yInicial,
            anchoMm: c.anchoMm,
            largoMm: c.largoMm,
            estado: c.estado,
            pedidoTaller: c.pedidoTaller,
            cliente: c.cliente,
          }))}
        />
      </div>

      <div className="overflow-x-auto card">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Fecha</th>
              <th className="px-4 py-2 font-medium">Pedido taller</th>
              <th className="px-4 py-2 font-medium">Cliente</th>
              <th className="px-4 py-2 font-medium">Ancho x Largo (mm)</th>
              <th className="px-4 py-2 font-medium">X, Y</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2 font-medium">Operario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {cortesDelRollo.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2">
                  {c.fecha ? new Date(c.fecha).toLocaleDateString("es-CO") : "—"}
                </td>
                <td className="px-4 py-2">{c.pedidoTaller ?? "—"}</td>
                <td className="px-4 py-2">{c.cliente ?? "—"}</td>
                <td className="px-4 py-2">
                  {c.anchoMm.toLocaleString("es-CO")} x {c.largoMm.toLocaleString("es-CO")}
                </td>
                <td className="px-4 py-2">
                  {c.xInicial.toLocaleString("es-CO")}, {c.yInicial.toLocaleString("es-CO")}
                </td>
                <td className="px-4 py-2">{c.estado}</td>
                <td className="px-4 py-2">{c.operario ?? "—"}</td>
              </tr>
            ))}
            {cortesDelRollo.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-neutral-400" colSpan={7}>
                  Este rollo no tiene cortes registrados todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-lg font-semibold text-brand-900">{value}</div>
      <div className="text-xs text-neutral-500">{label}</div>
    </div>
  );
}
