export const dynamic = "force-dynamic";

import Link from "next/link";
import { getHistorialCortes } from "@/lib/db/queries";
import { requireUsuario } from "@/lib/auth";

const ESTADO_STYLE: Record<string, string> = {
  VENDIDO: "bg-brand-100 text-brand-800",
  RETAL_UTIL: "bg-amber-100 text-amber-800",
  ELIMINADO: "bg-neutral-200 text-neutral-600",
};

export default async function HistorialPage() {
  await requireUsuario("historial");
  const data = await getHistorialCortes(200);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Historial de cortes</h1>
        <p className="text-sm text-neutral-600">
          {data.length} registros más recientes — reemplaza la hoja Historico_Cortes.
        </p>
      </div>

      <div className="overflow-x-auto card">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Fecha</th>
              <th className="px-4 py-2 font-medium">Lote</th>
              <th className="px-4 py-2 font-medium">Pedido taller</th>
              <th className="px-4 py-2 font-medium">Cliente</th>
              <th className="px-4 py-2 font-medium">Ancho x Largo (mm)</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2 font-medium">Operario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.map((c) => (
              <tr key={c.id} className="hover:bg-brand-50/60">
                <td className="px-4 py-2">
                  {c.fecha ? new Date(c.fecha).toLocaleDateString("es-CO") : "—"}
                </td>
                <td className="px-4 py-2">
                  <Link href={`/rollos/${encodeURIComponent(c.lote)}`} className="link-brand">
                    {c.lote}
                  </Link>
                </td>
                <td className="px-4 py-2">{c.pedidoTaller ?? "—"}</td>
                <td className="px-4 py-2">{c.cliente ?? "—"}</td>
                <td className="px-4 py-2">
                  {c.anchoMm.toLocaleString("es-CO")} x {c.largoMm.toLocaleString("es-CO")}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_STYLE[c.estado] ?? "bg-neutral-100"}`}
                  >
                    {c.estado}
                  </span>
                </td>
                <td className="px-4 py-2">{c.operario ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
