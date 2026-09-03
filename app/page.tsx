export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/lib/db";
import { rollos, retales, cortes } from "@/lib/db/schema";
import { eq, sql, gte } from "drizzle-orm";

async function getResumen() {
  const [rollosActivos] = await db
    .select({ n: sql<number>`count(*)` })
    .from(rollos)
    .where(eq(rollos.estado, "INICIADO"));
  const [retalesDisponibles] = await db
    .select({ n: sql<number>`count(*)` })
    .from(retales)
    .where(eq(retales.disponible, true));
  const [cortesTotal] = await db.select({ n: sql<number>`count(*)` }).from(cortes);
  const hace30dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [cortesRecientes] = await db
    .select({ n: sql<number>`count(*)` })
    .from(cortes)
    .where(gte(cortes.fecha, hace30dias));

  return {
    rollosActivos: rollosActivos?.n ?? 0,
    retalesDisponibles: retalesDisponibles?.n ?? 0,
    cortesTotal: cortesTotal?.n ?? 0,
    cortesRecientes: cortesRecientes?.n ?? 0,
  };
}

function Card({ label, value, href }: { label: string; value: number | string; href: string }) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-neutral-200 bg-white p-5 transition hover:border-neutral-400"
    >
      <div className="text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-neutral-500">{label}</div>
    </Link>
  );
}

export default async function Home() {
  const resumen = await getResumen();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inventario de Rollos — IBELTCO</h1>
        <p className="mt-1 text-neutral-600">
          Reemplaza el Excel de planos de rollos, histórico de cortes y análisis de anchos.
          Registra un pedido y el aplicativo indica exactamente de dónde cortar.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card label="Rollos activos" value={resumen.rollosActivos} href="/rollos" />
        <Card label="Retales disponibles" value={resumen.retalesDisponibles} href="/retales" />
        <Card label="Cortes últimos 30 días" value={resumen.cortesRecientes} href="/historial" />
        <Card label="Cortes históricos" value={resumen.cortesTotal} href="/historial" />
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-5">
        <h2 className="font-medium">¿Qué hacer primero?</h2>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-neutral-700">
          <li>
            Revisa el <Link className="underline" href="/rollos">inventario de rollos</Link> cargado
            desde Planos Rollos.xlsx.
          </li>
          <li>
            Registra un <Link className="underline" href="/pedidos/nuevo">nuevo pedido</Link> y deja
            que el motor de corte te diga de qué rollo o retal cortarlo, y en qué coordenadas.
          </li>
          <li>
            Consulta el <Link className="underline" href="/historial">historial</Link> para ver la
            trazabilidad de cada corte.
          </li>
        </ol>
      </div>
    </div>
  );
}
