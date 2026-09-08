export const dynamic = "force-dynamic";

import { getRetalesTodos, getLineasMaestroActivas } from "@/lib/db/queries";
import { RetalForm } from "@/components/retal-form";
import { requireUsuario } from "@/lib/auth";

export default async function RetalesPage() {
  await requireUsuario("retales");
  const [data, lineasData] = await Promise.all([getRetalesTodos(), getLineasMaestroActivas()]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Módulo de retales</h1>
        <p className="text-sm text-neutral-600">
          Cada pieza sobrante se controla <strong>individualmente</strong> (ancho x largo), ya sea
          generada automáticamente al confirmar un corte, o registrada manualmente aquí. Esto es lo
          que el ERP no tenía — antes solo sumaba un total sin saber en cuántos pedazos estaba
          repartido.
        </p>
      </div>
      <RetalForm retales={data} lineas={lineasData.map((l) => l.nombre)} />
    </div>
  );
}
