/**
 * Motor de sugerencia de corte.
 *
 * Es un algoritmo determinista (no un modelo de lenguaje) — decidir en qué
 * coordenadas exactas cortar una pieza es un problema de optimización
 * combinatoria (2D cutting-stock / shelf packing), no una tarea de lenguaje.
 * Un LLM puede fallar la aritmética de coordenadas; este algoritmo es
 * 100% verificable y reproducible, igual a como Diego ya lo hace a mano en
 * su "Plano de corte" — solo que aquí queda automatizado y con trazabilidad.
 *
 * Supuesto de diseño (pendiente de confirmar con Diego, ver acta Sesión 2):
 * las piezas NO se rotan — el ancho de la pieza siempre corre paralelo al
 * ancho del rollo. Si se confirma que sí se pueden rotar, `allowRotation`
 * habilita esa rama sin tocar el resto del motor.
 *
 * Estrategia de franjas (shelves), igual al "Plano de corte" existente:
 *   - Un rollo se corta en franjas apiladas a lo largo de Y (el largo).
 *   - Dentro de una franja, las piezas se acomodan una junto a otra a lo
 *     largo de X (el ancho), hasta agotar el ancho del rollo.
 *   - Al pedir una pieza nueva, primero se intenta encajar en una franja ya
 *     abierta (reutilizando ancho libre); si no cabe en ninguna, se abre una
 *     franja nueva al final del rollo.
 *
 * Prioridad de búsqueda (igual a como ya trabaja Diego: "primero validar
 * existencia de tramo"):
 *   1. Retales disponibles que alcancen la medida (best-fit: el que deja
 *      menor desperdicio).
 *   2. Si no hay retal, un rollo activo de la misma línea/referencia con
 *      ancho suficiente, usando el algoritmo de franjas.
 */

export type PiezaRequerida = {
  linea: string;
  referencia: string;
  anchoMm: number;
  largoMm: number;
};

export type RetalDisponible = {
  id: number;
  loteOrigen: string;
  linea: string;
  referencia: string;
  anchoMm: number;
  largoMm: number;
};

export type RolloActivo = {
  id: number;
  lote: string;
  linea: string;
  referencia: string;
  anchoMm: number;
  largoMm: number;
  largoUsadoMm: number;
};

/** Una franja (shelf) reconstruida a partir de los cortes ya hechos en un rollo. */
export type Franja = {
  yInicial: number;
  altoFranja: number; // = largo de la pieza más larga colocada en la franja
  anchoUsado: number; // acumulado de ancho ya consumido en esta franja
};

export type SugerenciaCorte =
  | {
      tipo: "retal";
      retalId: number;
      loteOrigen: string;
      xInicial: 0;
      yInicial: 0;
      anchoMm: number;
      largoMm: number;
      sobranteAnchoMm: number;
      sobranteLargoMm: number;
    }
  | {
      tipo: "rollo";
      rolloId: number;
      lote: string;
      xInicial: number;
      yInicial: number;
      anchoMm: number;
      largoMm: number;
      abreFranjaNueva: boolean;
    }
  | { tipo: "sin_material" };

const EPS = 1e-6;

/** Reconstruye las franjas ya abiertas de un rollo a partir de sus cortes. */
export function reconstruirFranjas(
  cortesDelRollo: { xInicial: number; yInicial: number; anchoMm: number; largoMm: number }[]
): Franja[] {
  const porY = new Map<number, Franja>();
  for (const c of cortesDelRollo) {
    const key = c.yInicial;
    const existente = porY.get(key);
    const finAncho = c.xInicial + c.anchoMm;
    if (existente) {
      existente.anchoUsado = Math.max(existente.anchoUsado, finAncho);
      existente.altoFranja = Math.max(existente.altoFranja, c.largoMm);
    } else {
      porY.set(key, {
        yInicial: c.yInicial,
        altoFranja: c.largoMm,
        anchoUsado: finAncho,
      });
    }
  }
  return [...porY.values()].sort((a, b) => a.yInicial - b.yInicial);
}

/** Elige, entre los retales candidatos, el de menor desperdicio (best-fit). */
export function elegirMejorRetal(
  pieza: PiezaRequerida,
  retales: RetalDisponible[]
): RetalDisponible | null {
  const candidatos = retales.filter(
    (r) =>
      r.linea === pieza.linea &&
      r.referencia === pieza.referencia &&
      r.anchoMm + EPS >= pieza.anchoMm &&
      r.largoMm + EPS >= pieza.largoMm
  );
  if (candidatos.length === 0) return null;

  candidatos.sort((a, b) => {
    const desperdicioA = a.anchoMm * a.largoMm - pieza.anchoMm * pieza.largoMm;
    const desperdicioB = b.anchoMm * b.largoMm - pieza.anchoMm * pieza.largoMm;
    return desperdicioA - desperdicioB;
  });
  return candidatos[0];
}

/**
 * Ubica una pieza dentro de un rollo usando el algoritmo de franjas.
 * `franjas` debe venir de `reconstruirFranjas` sobre los cortes existentes
 * de ese rollo.
 */
export function ubicarEnRollo(
  pieza: PiezaRequerida,
  rollo: RolloActivo,
  franjas: Franja[]
): { xInicial: number; yInicial: number; abreFranjaNueva: boolean } | null {
  if (pieza.anchoMm > rollo.anchoMm + EPS) return null; // no cabe ni de ancho

  // 1. Intentar encajar en una franja abierta con espacio suficiente,
  //    priorizando la que deje menos ancho sobrante (best-fit).
  const candidatas = franjas
    .filter(
      (f) =>
        rollo.anchoMm - f.anchoUsado + EPS >= pieza.anchoMm &&
        f.altoFranja + EPS >= pieza.largoMm
    )
    .sort(
      (a, b) =>
        rollo.anchoMm - b.anchoUsado - pieza.anchoMm - (rollo.anchoMm - a.anchoUsado - pieza.anchoMm)
    );

  if (candidatas.length > 0) {
    const franja = candidatas[0];
    return { xInicial: franja.anchoUsado, yInicial: franja.yInicial, abreFranjaNueva: false };
  }

  // 2. Ninguna franja sirve: abrir una nueva al final del rollo.
  const yNueva = rollo.largoUsadoMm;
  if (yNueva + pieza.largoMm > rollo.largoMm + EPS) return null; // no cabe de largo
  return { xInicial: 0, yInicial: yNueva, abreFranjaNueva: true };
}

/** Una opción de corte candidata, para mostrar al usuario junto a las demás. */
export type CandidatoCorte =
  | {
      tipo: "retal";
      retalId: number;
      loteOrigen: string;
      linea: string;
      referencia: string;
      anchoDisponible: number;
      largoDisponible: number;
      xSugerido: 0;
      ySugerido: 0;
      desperdicioMm2: number;
      sugerido: boolean;
    }
  | {
      tipo: "rollo";
      rolloId: number;
      lote: string;
      linea: string;
      referencia: string;
      anchoRollo: number;
      largoDisponible: number;
      xSugerido: number;
      ySugerido: number;
      abreFranjaNueva: boolean;
      desperdicioMm2: number;
      sugerido: boolean;
    };

/**
 * Lista TODAS las opciones donde cabría la pieza (retales primero, luego
 * rollos), cada una con su propia posición sugerida — para que el usuario
 * elija la pieza, no solo confirme la que el motor prefiere. La primera
 * opción de la lista es la de menor desperdicio (`sugerido: true`).
 */
export function listarCandidatos(
  pieza: PiezaRequerida,
  retalesDisponibles: RetalDisponible[],
  rollosActivos: RolloActivo[],
  cortesPorRollo: Map<string, { xInicial: number; yInicial: number; anchoMm: number; largoMm: number }[]>
): CandidatoCorte[] {
  const candidatosRetal: CandidatoCorte[] = retalesDisponibles
    .filter(
      (r) =>
        r.linea === pieza.linea &&
        r.referencia === pieza.referencia &&
        r.anchoMm + EPS >= pieza.anchoMm &&
        r.largoMm + EPS >= pieza.largoMm
    )
    .map((r) => ({
      tipo: "retal" as const,
      retalId: r.id,
      loteOrigen: r.loteOrigen,
      linea: r.linea,
      referencia: r.referencia,
      anchoDisponible: r.anchoMm,
      largoDisponible: r.largoMm,
      xSugerido: 0 as const,
      ySugerido: 0 as const,
      desperdicioMm2: r.anchoMm * r.largoMm - pieza.anchoMm * pieza.largoMm,
      sugerido: false,
    }))
    .sort((a, b) => a.desperdicioMm2 - b.desperdicioMm2);

  const candidatosRollo: CandidatoCorte[] = [];
  const rollosAptos = rollosActivos
    .filter(
      (r) =>
        r.linea === pieza.linea &&
        r.referencia === pieza.referencia &&
        r.anchoMm + EPS >= pieza.anchoMm
    )
    .sort((a, b) => a.largoMm - a.largoUsadoMm - (b.largoMm - b.largoUsadoMm));

  for (const rollo of rollosAptos) {
    const franjas = reconstruirFranjas(cortesPorRollo.get(rollo.lote) ?? []);
    const ubicacion = ubicarEnRollo(pieza, rollo, franjas);
    if (ubicacion) {
      const largoDisponible = rollo.largoMm - rollo.largoUsadoMm;
      candidatosRollo.push({
        tipo: "rollo",
        rolloId: rollo.id,
        lote: rollo.lote,
        linea: rollo.linea,
        referencia: rollo.referencia,
        anchoRollo: rollo.anchoMm,
        largoDisponible,
        xSugerido: ubicacion.xInicial,
        ySugerido: ubicacion.yInicial,
        abreFranjaNueva: ubicacion.abreFranjaNueva,
        desperdicioMm2: rollo.anchoMm * largoDisponible - pieza.anchoMm * pieza.largoMm,
        sugerido: false,
      });
    }
  }
  candidatosRollo.sort((a, b) => a.desperdicioMm2 - b.desperdicioMm2);

  // Retales primero (aprovechar sobrantes antes que abrir/avanzar un rollo),
  // y dentro de cada grupo, menor desperdicio primero.
  const todos = [...candidatosRetal, ...candidatosRollo];
  if (todos.length > 0) todos[0] = { ...todos[0], sugerido: true };
  return todos;
}

/**
 * Punto de entrada: dada una pieza requerida y el inventario disponible,
 * devuelve dónde cortarla. Prioriza retales sobre rollos nuevos.
 *
 * @deprecated preferir `listarCandidatos` para dejar elegir al usuario;
 * se conserva por si algún llamador solo necesita la mejor sugerencia.
 */
export function sugerirCorte(
  pieza: PiezaRequerida,
  retalesDisponibles: RetalDisponible[],
  rollosActivos: RolloActivo[],
  cortesPorRollo: Map<string, { xInicial: number; yInicial: number; anchoMm: number; largoMm: number }[]>
): SugerenciaCorte {
  const retal = elegirMejorRetal(pieza, retalesDisponibles);
  if (retal) {
    return {
      tipo: "retal",
      retalId: retal.id,
      loteOrigen: retal.loteOrigen,
      xInicial: 0,
      yInicial: 0,
      anchoMm: pieza.anchoMm,
      largoMm: pieza.largoMm,
      sobranteAnchoMm: retal.anchoMm - pieza.anchoMm,
      sobranteLargoMm: retal.largoMm - pieza.largoMm,
    };
  }

  const candidatosRollo = rollosActivos
    .filter(
      (r) =>
        r.linea === pieza.linea &&
        r.referencia === pieza.referencia &&
        r.anchoMm + EPS >= pieza.anchoMm
    )
    // Preferir el rollo con menos largo disponible que aún alcance (best-fit
    // también a nivel de rollo, para ir agotando rollos abiertos primero).
    .sort((a, b) => a.largoMm - a.largoUsadoMm - (b.largoMm - b.largoUsadoMm));

  for (const rollo of candidatosRollo) {
    const franjas = reconstruirFranjas(cortesPorRollo.get(rollo.lote) ?? []);
    const ubicacion = ubicarEnRollo(pieza, rollo, franjas);
    if (ubicacion) {
      return {
        tipo: "rollo",
        rolloId: rollo.id,
        lote: rollo.lote,
        xInicial: ubicacion.xInicial,
        yInicial: ubicacion.yInicial,
        anchoMm: pieza.anchoMm,
        largoMm: pieza.largoMm,
        abreFranjaNueva: ubicacion.abreFranjaNueva,
      };
    }
  }

  return { tipo: "sin_material" };
}
