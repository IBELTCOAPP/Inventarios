# Inventario de Rollos — IBELTCO

Aplicativo que reemplaza el Excel de planos de rollos, histórico de cortes y
análisis de anchos de Importadora de correas colombiana SAS (IBELTCO). Dado
un pedido (línea, referencia, ancho, largo), el motor de corte indica
exactamente de qué rollo o retal cortarlo y en qué coordenadas (X, Y),
priorizando reutilizar retales antes de abrir un rollo nuevo.

Construido en el marco del acompañamiento de asesoría (Ruta TOP Long Tail /
ACESCORP) — ver actas de la Sesión 1 y Sesión 2.

## Stack

- **Next.js 16** (App Router, Turbopack) + Tailwind CSS 4
- **Neon Postgres** (vía integración de Vercel) + **Drizzle ORM**
- Desplegado en **Vercel**

## Motor de corte

`lib/cutting-engine.ts` es un algoritmo determinista (no un LLM) de
empaquetado 2D por franjas ("shelf packing"), igual al método manual que ya
usa Diego en el "Plano de corte" de Excel:

1. Primero busca un **retal disponible** que alcance la medida (best-fit,
   el que deja menor desperdicio).
2. Si no hay retal, busca un **rollo activo** de la misma línea/referencia y
   calcula dónde ubicar la pieza dentro de las franjas ya cortadas, o abre
   una franja nueva si no cabe en ninguna.

**Supuesto pendiente de confirmar con Diego:** las piezas no se rotan — el
ancho de la pieza siempre corre paralelo al ancho del rollo. Si se confirma
que sí se pueden rotar, hay que extender `ubicarEnRollo` para evaluar ambas
orientaciones.

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # o `vercel env pull .env.local`
npm run db:push              # aplica el esquema a la base de datos
npm run db:seed              # carga el inventario histórico real (scripts/seed_*.json)
npm run dev
```

`scripts/seed_*.json` contiene datos reales del cliente y no está en el
repo — pídelos a quien tenga el Excel original (`Planos Rollos.xlsx`,
`Analisis Anchos Malla teflon Cafe.xlsx`) o regenéralos con el script de
extracción usado en la sesión de bootstrap.

## Estructura de datos

Ver `lib/db/schema.ts`:

- `rollos` — inventario maestro (reemplaza `Inventario_Rollos`)
- `retales` — sobrantes reutilizables (no existía como tabla propia antes;
  es el hueco que el ERP no cubre)
- `cortes` — bitácora de cada corte, con X/Y para reconstruir el plano visual
  (reemplaza `Historico_Cortes`)
- `anchos_analisis` — snapshot del análisis Pareto de anchos vendidos

## Pendiente / próximos pasos

- Confirmar con Diego si las piezas se pueden rotar.
- Importar automáticamente desde el export del ERP (HGI) en vez de la carga
  manual inicial.
- Parseo del "detalle" de pedido de taller (texto libre) a campos
  estructurados vía IA (Claude), una vez el ERP permita exportar el vínculo
  código-detalle (ver acta Sesión 2).
- Despliegue automático en cada push: requiere que alguien con rol Admin en
  este repo autorice la app de GitHub de Vercel.
