type CortePlano = {
  id: number;
  xInicial: number;
  yInicial: number;
  anchoMm: number;
  largoMm: number;
  estado: string;
  pedidoTaller: string | null;
  cliente: string | null;
};

const COLOR_POR_ESTADO: Record<string, string> = {
  VENDIDO: "#93c5fd", // azul — pieza vendida
  RETAL_UTIL: "#fde68a", // amarillo — sobrante reutilizable
  ELIMINADO: "#e5e7eb", // gris — desperdicio
};

/**
 * Dibuja el rollo como un rectángulo (ancho x largo) con cada corte
 * superpuesto en su X/Y real — el mismo dibujo que Diego arma a mano en el
 * Excel "Plano de corte" / "DatosGrafico", pero generado automáticamente.
 */
export function PlanoDeCorte({
  anchoRollo,
  largoRollo,
  largoUsado,
  cortes,
}: {
  anchoRollo: number;
  largoRollo: number;
  largoUsado: number;
  cortes: CortePlano[];
}) {
  // El rollo se dibuja "acostado": el ancho del rollo en el eje horizontal
  // de la pantalla y el largo en el eje vertical, igual que en el Excel.
  // Usamos un ancho de lienzo fijo y escalamos el alto proporcionalmente al
  // largo, para que rollos muy largos no se vean como una línea.
  const anchoSvg = 480;
  const escalaX = anchoSvg / anchoRollo;
  const altoSvg = Math.min(Math.max(largoRollo * escalaX, 120), 900);
  const escalaY = altoSvg / largoRollo;

  return (
    <div className="overflow-x-auto">
      <svg
        width={anchoSvg}
        height={altoSvg}
        viewBox={`0 0 ${anchoSvg} ${altoSvg}`}
        className="rounded border border-neutral-300 bg-neutral-50"
      >
        {/* frontera de lo ya usado */}
        <rect
          x={0}
          y={0}
          width={anchoRollo * escalaX}
          height={largoUsado * escalaY}
          fill="#f8fafc"
          stroke="#cbd5e1"
          strokeDasharray="4 3"
        />
        {cortes.map((c) => (
          <g key={c.id}>
            <rect
              x={c.xInicial * escalaX}
              y={c.yInicial * escalaY}
              width={Math.max(c.anchoMm * escalaX, 1)}
              height={Math.max(c.largoMm * escalaY, 1)}
              fill={COLOR_POR_ESTADO[c.estado] ?? "#d1d5db"}
              stroke="#475569"
              strokeWidth={0.5}
            >
              <title>
                {(c.pedidoTaller ?? "sin pedido") +
                  (c.cliente ? ` · ${c.cliente}` : "") +
                  ` · ${c.anchoMm}x${c.largoMm}mm · (${c.xInicial}, ${c.yInicial})`}
              </title>
            </rect>
          </g>
        ))}
        {/* borde del rollo completo */}
        <rect
          x={0}
          y={0}
          width={anchoRollo * escalaX}
          height={largoRollo * escalaY}
          fill="none"
          stroke="#0f172a"
          strokeWidth={1.5}
        />
      </svg>
      <div className="mt-2 flex gap-4 text-xs text-neutral-600">
        <Legend color={COLOR_POR_ESTADO.VENDIDO} label="Vendido" />
        <Legend color={COLOR_POR_ESTADO.RETAL_UTIL} label="Retal útil" />
        <Legend color={COLOR_POR_ESTADO.ELIMINADO} label="Eliminado" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-3 w-3 rounded-sm border border-neutral-400" style={{ background: color }} />
      {label}
    </span>
  );
}
