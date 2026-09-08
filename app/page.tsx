export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db";
import { rollos, retales, cortes, clientes } from "@/lib/db/schema";
import { eq, sql, gte, desc } from "drizzle-orm";
import { getAnchosAnalisis } from "@/lib/db/queries";
import { getFilasPlaneacion } from "@/lib/planeacion";

async function getResumen() {
  const [
    [rollosActivos],
    [retalesDisponibles],
    [cortesTotal],
    [cortesRecientes],
    [clientesActivos],
    [areaVendida],
    rollosTodos,
    ultimosCortes,
    anchosAnalisis,
  ] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(rollos).where(eq(rollos.estado, "INICIADO")),
    db.select({ n: sql<number>`count(*)` }).from(retales).where(eq(retales.disponible, true)),
    db.select({ n: sql<number>`count(*)` }).from(cortes),
    db
      .select({ n: sql<number>`count(*)` })
      .from(cortes)
      .where(gte(cortes.fecha, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))),
    db.select({ n: sql<number>`count(*)` }).from(clientes).where(eq(clientes.estado, "Activo")),
    db
      .select({ n: sql<number>`coalesce(sum(${cortes.areaMm2}), 0)` })
      .from(cortes)
      .where(eq(cortes.estado, "VENDIDO")),
    db.select({ estado: rollos.estado }).from(rollos),
    db.select().from(cortes).orderBy(desc(cortes.fecha)).limit(6),
    getAnchosAnalisis(),
  ]);

  const porEstado: Record<string, number> = { INICIADO: 0, COMPLETO: 0, AGOTADO: 0 };
  for (const r of rollosTodos) porEstado[r.estado] = (porEstado[r.estado] ?? 0) + 1;

  return {
    rollosActivos: rollosActivos?.n ?? 0,
    retalesDisponibles: retalesDisponibles?.n ?? 0,
    cortesTotal: cortesTotal?.n ?? 0,
    cortesRecientes: cortesRecientes?.n ?? 0,
    clientesActivos: clientesActivos?.n ?? 0,
    areaVendidaM2: (areaVendida?.n ?? 0) / 1_000_000,
    rollosTotal: rollosTodos.length,
    porEstado,
    ultimosCortes,
    topAnchos: anchosAnalisis.slice(0, 6),
  };
}

const ESTADO_CORTE_STYLE: Record<string, string> = {
  VENDIDO: "bg-brand-100 text-brand-800",
  RETAL_UTIL: "bg-amber-100 text-amber-800",
  ELIMINADO: "bg-neutral-200 text-neutral-600",
};

const ESTADO_ROLLO_COLOR: Record<string, string> = {
  INICIADO: "bg-brand-500",
  COMPLETO: "bg-emerald-500",
  AGOTADO: "bg-neutral-300",
};

export default async function Home() {
  const [r, filasPlaneacion] = await Promise.all([getResumen(), getFilasPlaneacion()]);
  const maxAncho = Math.max(...r.topAnchos.map((a) => a.unidadesVendidas), 1);
  const nReordenar = filasPlaneacion.filter((f) => f.estado === "REORDENAR").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-brand-950">
          Inventario de Rollos — IBELTCO
        </h1>
        <p className="mt-1 text-neutral-600">
          Reemplaza el Excel de planos de rollos, histórico de cortes y análisis de anchos.
          Registra un pedido y el aplicativo indica exactamente de dónde cortar.
        </p>
      </div>

      {nReordenar > 0 && (
        <Link
          href="/planeacion"
          className="block rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 transition hover:border-red-300"
        >
          ⚠️ <strong>{nReordenar}</strong> referencia{nReordenar === 1 ? "" : "s"} por debajo del punto de
          reorden — revisa la <span className="underline">planeación de inventario →</span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card label="Rollos activos" value={r.rollosActivos} href="/rollos" />
        <Card label="Retales disponibles" value={r.retalesDisponibles} href="/retales" />
        <Card label="Cortes últimos 30 días" value={r.cortesRecientes} href="/historial" />
        <Card label="Cortes históricos" value={r.cortesTotal} href="/historial" />
        <Card label="Clientes activos" value={r.clientesActivos} href="/clientes" />
        <Card label="m² vendidos" value={r.areaVendidaM2.toFixed(1)} href="/historial" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-1">
          <h2 className="font-medium text-brand-950">Rollos por estado</h2>
          <p className="mt-1 text-xs text-neutral-500">{r.rollosTotal} rollos en total</p>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-neutral-100">
            {(["INICIADO", "COMPLETO", "AGOTADO"] as const).map((estado) => {
              const n = r.porEstado[estado] ?? 0;
              const pct = r.rollosTotal ? (n / r.rollosTotal) * 100 : 0;
              return pct > 0 ? (
                <div
                  key={estado}
                  className={ESTADO_ROLLO_COLOR[estado]}
                  style={{ width: `${pct}%` }}
                  title={`${estado}: ${n}`}
                />
              ) : null;
            })}
          </div>
          <div className="mt-3 space-y-1.5 text-sm">
            {(["INICIADO", "COMPLETO", "AGOTADO"] as const).map((estado) => (
              <div key={estado} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-neutral-600">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${ESTADO_ROLLO_COLOR[estado]}`} />
                  {estado}
                </span>
                <span className="font-medium text-neutral-900">{r.porEstado[estado] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-brand-950">Anchos más vendidos</h2>
            <Link href="/anchos" className="link-brand text-xs">
              Ver análisis completo →
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {r.topAnchos.map((a) => (
              <div key={a.id} className="flex items-center gap-3 text-sm">
                <div className="w-16 shrink-0 text-right font-medium">{a.anchoMm} mm</div>
                <div className="h-3.5 flex-1 rounded bg-neutral-100">
                  <div
                    className="h-3.5 rounded bg-gradient-to-r from-brand-500 to-brand-400"
                    style={{ width: `${(a.unidadesVendidas / maxAncho) * 100}%` }}
                  />
                </div>
                <div className="w-20 shrink-0 text-neutral-500">{a.unidadesVendidas} u.</div>
              </div>
            ))}
            {r.topAnchos.length === 0 && (
              <p className="text-sm text-neutral-400">Aún no hay análisis de anchos cargado.</p>
            )}
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <div className="flex items-center justify-between px-5 pt-4">
          <h2 className="font-medium text-brand-950">Últimos cortes registrados</h2>
          <Link href="/historial" className="link-brand text-xs">
            Ver historial completo →
          </Link>
        </div>
        <table className="mt-3 w-full min-w-[640px] text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-5 py-2 font-medium">Fecha</th>
              <th className="px-4 py-2 font-medium">Lote</th>
              <th className="px-4 py-2 font-medium">Cliente</th>
              <th className="px-4 py-2 font-medium">Ancho x Largo (mm)</th>
              <th className="px-4 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {r.ultimosCortes.map((c) => (
              <tr key={c.id} className="hover:bg-brand-50/60">
                <td className="px-5 py-2">{c.fecha ? new Date(c.fecha).toLocaleDateString("es-CO") : "—"}</td>
                <td className="px-4 py-2">
                  <Link href={`/rollos/${encodeURIComponent(c.lote)}`} className="link-brand">
                    {c.lote}
                  </Link>
                </td>
                <td className="px-4 py-2">{c.cliente ?? "—"}</td>
                <td className="px-4 py-2">
                  {c.anchoMm.toLocaleString("es-CO")} x {c.largoMm.toLocaleString("es-CO")}
                </td>
                <td className="px-4 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTADO_CORTE_STYLE[c.estado] ?? "bg-neutral-100"}`}>
                    {c.estado}
                  </span>
                </td>
              </tr>
            ))}
            {r.ultimosCortes.length === 0 && (
              <tr>
                <td className="px-5 py-6 text-center text-neutral-400" colSpan={5}>
                  Todavía no hay cortes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="h-4" />
      </div>

      <div className="card p-5">
        <h2 className="font-medium text-brand-950">¿Qué hacer primero?</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-neutral-700">
          <li>
            Revisa el <Link className="link-brand" href="/rollos">inventario de rollos</Link> cargado
            desde Planos Rollos.xlsx.
          </li>
          <li>
            Registra un <Link className="link-brand" href="/pedidos/nuevo">nuevo pedido</Link> y deja
            que el motor de corte te diga de qué rollo o retal cortarlo, y en qué coordenadas.
          </li>
          <li>
            Consulta el <Link className="link-brand" href="/historial">historial</Link> para ver la
            trazabilidad de cada corte.
          </li>
        </ol>
      </div>
    </div>
  );
}

function Card({ label, value, href }: { label: string; value: number | string; href: string }) {
  return (
    <Link href={href} className="card block p-5 transition hover:border-brand-300 hover:shadow-md">
      <div className="text-3xl font-semibold text-brand-950">{value}</div>
      <div className="mt-1 text-sm text-neutral-500">{label}</div>
    </Link>
  );
}
