export const dynamic = "force-dynamic";

import Link from "next/link";
import { getRollos } from "@/lib/db/queries";

const ESTADO_STYLE: Record<string, string> = {
  INICIADO: "bg-amber-100 text-amber-800",
  COMPLETO: "bg-emerald-100 text-emerald-800",
  AGOTADO: "bg-neutral-200 text-neutral-600",
};

export default async function RollosPage() {
  const data = await getRollos();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Inventario de rollos</h1>
        <p className="text-sm text-neutral-600">
          {data.length} rollos — reemplaza la hoja Inventario_Rollos de Planos Rollos.xlsx.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
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
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {data.map((r) => {
              const disponible = r.largoMm - r.largoUsadoMm;
              return (
                <tr key={r.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-2">
                    <Link href={`/rollos/${encodeURIComponent(r.lote)}`} className="font-medium underline">
                      {r.lote}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{r.linea}</td>
                  <td className="px-4 py-2">{r.referencia}</td>
                  <td className="px-4 py-2">{r.anchoMm.toLocaleString("es-CO")}</td>
                  <td className="px-4 py-2">{r.largoMm.toLocaleString("es-CO")}</td>
                  <td className="px-4 py-2">{r.largoUsadoMm.toLocaleString("es-CO")}</td>
                  <td className="px-4 py-2">{disponible.toLocaleString("es-CO")}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_STYLE[r.estado] ?? "bg-neutral-100"}`}
                    >
                      {r.estado}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
