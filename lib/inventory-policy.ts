/**
 * Motor de política de inventario (planeación de demanda, planeación de
 * pedidos y puntos de reorden — los tres frentes de la dimensión D2
 * ABASTECIMIENTO del acta de la Sesión 1/2, ver memoria del proyecto).
 *
 * Es una política clásica (s, S) de reabastecimiento por punto de reorden:
 *   - Se calcula la demanda diaria promedio de cada línea+referencia a
 *     partir del histórico real de cortes VENDIDOS (planeación de demanda).
 *   - El punto de reorden `s` es la demanda esperada durante el tiempo de
 *     reposición del proveedor, más un colchón de seguridad.
 *   - El nivel objetivo `S` es `s` más una cobertura adicional configurable
 *     (para no tener que volver a pedir en cuanto se toca el punto de
 *     reorden).
 *   - La cantidad sugerida a pedir es lo que falta para llegar de S al
 *     stock actual (planeación de pedidos).
 *
 * Todo se mide en **m² (área)** en vez de mm de largo — así una referencia
 * cuyo ancho de rollo varía un poco entre lotes (o que también se abastece
 * de retales de otro ancho) sigue siendo comparable, sin tener que asumir
 * un ancho "estándar" por referencia.
 *
 * No hay datos de costos ni de tiempos de entrega reales del proveedor en
 * el sistema todavía (ver `politicasInventario.leadTimeDias` — hoy es un
 * valor que Diego/Diana calibran a mano), así que esto es deliberadamente
 * una política simple y explicable, no un MRP completo.
 */

export type InsumosPolitica = {
  /** m² disponibles ahora mismo (rollos activos + retales) para esta referencia. */
  stockActualM2: number;
  /** m² vendidos por día, promedio sobre la ventana de análisis reciente. */
  demandaDiariaM2: number;
  /** Tiempo de reposición del proveedor, en días. */
  leadTimeDias: number;
  /** Días de cobertura adicional deseados más allá del lead time. */
  diasCoberturaObjetivo: number;
  /** Colchón manual en m², sobre lo que ya cubre el lead time. */
  stockSeguridadM2: number;
};

export type ResultadoPolitica = {
  /** Punto de reorden (s): por debajo de esto, hay que pedir ya. */
  puntoReordenM2: number;
  /** Nivel objetivo (S): a dónde se quiere llegar al pedir. */
  nivelObjetivoM2: number;
  /** Cuántos días dura el stock actual al ritmo de venta reciente (Infinity si no hay demanda). */
  diasCobertura: number;
  /** Cuánto pedir ahora para llegar al nivel objetivo (0 si todavía no toca). */
  cantidadSugeridaM2: number;
  /** REORDENAR si el stock actual ya cayó por debajo del punto de reorden. */
  estado: "REORDENAR" | "OK" | "SIN_DEMANDA";
};

export function calcularPolitica(insumos: InsumosPolitica): ResultadoPolitica {
  const { stockActualM2, demandaDiariaM2, leadTimeDias, diasCoberturaObjetivo, stockSeguridadM2 } = insumos;

  const puntoReordenM2 = demandaDiariaM2 * leadTimeDias + stockSeguridadM2;
  const nivelObjetivoM2 = demandaDiariaM2 * (leadTimeDias + diasCoberturaObjetivo) + stockSeguridadM2;
  const diasCobertura = demandaDiariaM2 > 0 ? stockActualM2 / demandaDiariaM2 : Infinity;
  const cantidadSugeridaM2 = Math.max(0, nivelObjetivoM2 - stockActualM2);

  let estado: ResultadoPolitica["estado"];
  if (demandaDiariaM2 <= 0) {
    // Sin ventas recientes no hay con qué proyectar demanda — no se marca
    // REORDENAR aunque el stock esté bajo, para no generar alertas falsas
    // sobre referencias que simplemente no se han movido últimamente.
    estado = "SIN_DEMANDA";
  } else if (stockActualM2 < puntoReordenM2) {
    estado = "REORDENAR";
  } else {
    estado = "OK";
  }

  return { puntoReordenM2, nivelObjetivoM2, diasCobertura, cantidadSugeridaM2, estado };
}

export const MM2_POR_M2 = 1_000_000;
