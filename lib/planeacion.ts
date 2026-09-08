import {
  getReferenciasTodas,
  getStockActualPorReferencia,
  getDemandaRecientePorReferencia,
  getPoliticasInventario,
} from "@/lib/db/queries";
import { calcularPolitica, type ResultadoPolitica } from "@/lib/inventory-policy";

export const VENTANA_DIAS_DEMANDA = 90;
const DEFAULTS = { leadTimeDias: 30, diasCoberturaObjetivo: 30, stockSeguridadM2: 0 };
const ORDEN_ESTADO = { REORDENAR: 0, OK: 1, SIN_DEMANDA: 2 };

function clave(linea: string, referencia: string) {
  return `${linea}|||${referencia}`;
}

export type FilaPlaneacion = {
  linea: string;
  referencia: string;
  stockActualM2: number;
  demandaDiariaM2: number;
  leadTimeDias: number;
  diasCoberturaObjetivo: number;
  stockSeguridadM2: number;
} & ResultadoPolitica;

/** Une inventario actual + demanda reciente + política calibrada por Diego, y aplica calcularPolitica a cada referencia. */
export async function getFilasPlaneacion(): Promise<FilaPlaneacion[]> {
  const [referencias, stock, demandaReciente, politicas] = await Promise.all([
    getReferenciasTodas(),
    getStockActualPorReferencia(),
    getDemandaRecientePorReferencia(VENTANA_DIAS_DEMANDA),
    getPoliticasInventario(),
  ]);

  const filas = referencias.map((r) => {
    const k = clave(r.linea, r.referencia);
    const politica = politicas.get(k);
    const stockActualM2 = stock.get(k) ?? 0;
    const demandaDiariaM2 = (demandaReciente.get(k) ?? 0) / VENTANA_DIAS_DEMANDA;
    const leadTimeDias = politica?.leadTimeDias ?? DEFAULTS.leadTimeDias;
    const diasCoberturaObjetivo = politica?.diasCoberturaObjetivo ?? DEFAULTS.diasCoberturaObjetivo;
    const stockSeguridadM2 = politica?.stockSeguridadM2 ?? DEFAULTS.stockSeguridadM2;

    const resultado = calcularPolitica({
      stockActualM2,
      demandaDiariaM2,
      leadTimeDias,
      diasCoberturaObjetivo,
      stockSeguridadM2,
    });

    return {
      linea: r.linea,
      referencia: r.referencia,
      stockActualM2,
      demandaDiariaM2,
      leadTimeDias,
      diasCoberturaObjetivo,
      stockSeguridadM2,
      ...resultado,
    };
  });

  filas.sort((a, b) => ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado] || a.referencia.localeCompare(b.referencia));
  return filas;
}
