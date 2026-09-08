export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUsuario } from "@/lib/auth";

const SECCIONES = [
  { id: "inicio", label: "Inicio (dashboard)" },
  { id: "rollos", label: "Rollos" },
  { id: "retales", label: "Retales" },
  { id: "nuevo-pedido", label: "Nuevo pedido" },
  { id: "historial", label: "Historial" },
  { id: "anchos", label: "Análisis de anchos" },
  { id: "planeacion", label: "Planeación de inventario" },
  { id: "maestros", label: "Clientes, proveedores, líneas, operarios" },
  { id: "usuarios", label: "Usuarios (Administrador)" },
  { id: "mi-cuenta", label: "Mi cuenta" },
  { id: "glosario", label: "Glosario" },
];

export default async function ManualPage() {
  await requireUsuario();

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <nav className="hidden lg:block">
        <div className="sticky top-6 space-y-1">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">Contenido</p>
          {SECCIONES.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="block rounded-md px-2 py-1.5 text-sm text-neutral-600 hover:bg-brand-50 hover:text-brand-800">
              {s.label}
            </a>
          ))}
        </div>
      </nav>

      <div className="min-w-0 space-y-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-950">Manual de usuario</h1>
          <p className="mt-1 text-neutral-600">
            Guía de cada sección del aplicativo de inventario de rollos de IBELTCO. Este manual es
            accesible desde el ícono <strong>📖 Manual</strong> en la parte superior de cualquier página.
          </p>
        </div>

        <Seccion id="inicio" titulo="Inicio (dashboard)">
          <p>
            Es la página que ves al entrar. Resume el estado general del inventario en un vistazo:
          </p>
          <Lista
            items={[
              <><strong>Rollos activos</strong>: rollos en estado INICIADO (todavía tienen material sin usar).</>,
              <><strong>Retales disponibles</strong>: piezas sobrantes que aún se pueden vender/cortar.</>,
              <><strong>Cortes últimos 30 días / históricos</strong>: cuántos cortes se han registrado.</>,
              <><strong>Clientes activos</strong> y <strong>m² vendidos</strong>: totales acumulados.</>,
              <><strong>Rollos por estado</strong>: cuántos rollos están INICIADO, COMPLETO o AGOTADO.</>,
              <><strong>Anchos más vendidos</strong>: adelanto del análisis de anchos completo.</>,
              <><strong>Últimos cortes registrados</strong>: los 6 más recientes, con link directo al rollo.</>,
            ]}
          />
          <p>
            Si alguna referencia está por debajo de su punto de reorden, aparece una alerta roja arriba
            de todo — lleva directo a <Ancla id="planeacion">Planeación</Ancla>.
          </p>
        </Seccion>

        <Seccion id="rollos" titulo="Rollos">
          <p>
            El inventario maestro de rollos — reemplaza la hoja <em>Inventario_Rollos</em> del Excel.
            Cada rollo tiene un <strong>lote</strong> (código único), <strong>línea</strong> y{" "}
            <strong>referencia</strong> (el tipo de material), <strong>ancho</strong> y{" "}
            <strong>largo total</strong>, y un <strong>largo ya usado</strong> que avanza automáticamente
            cada vez que se confirma un corte sobre ese rollo.
          </p>
          <p>
            Clic en el lote de cualquier rollo para ver su <strong>plano de corte</strong>: un dibujo del
            rollo completo (ancho x largo) con cada pieza ya cortada dibujada en su posición real (X, Y),
            coloreada según su estado (azul = vendido, amarillo = retal útil, gris = eliminado/desperdicio)
            — el mismo dibujo que antes se armaba a mano en el Excel, pero automático. Debajo del plano
            queda la tabla completa de cortes de ese rollo (fecha, pedido, cliente, medida, operario).
          </p>
          <p>
            El botón <strong>➕ Nuevo rollo</strong> permite registrar un rollo que acaba de llegar. El
            estado (INICIADO / COMPLETO / AGOTADO) normalmente se actualiza solo al confirmar cortes, pero
            se puede forzar a mano si hace falta corregir algo.
          </p>
        </Seccion>

        <Seccion id="retales" titulo="Retales">
          <p>
            Un <strong>retal</strong> es una pieza sobrante que queda disponible como inventario propio,
            independiente del rollo del que salió — esto es lo que el ERP viejo no tenía: antes solo se
            sumaba un total de sobrantes sin saber en cuántos pedazos reales estaba repartido, lo que en la
            práctica los hacía invendibles.
          </p>
          <p>
            Los retales se generan <strong>automáticamente</strong> al confirmar un corte, cuando sobra
            material aprovechable (por encima de 50 mm de ancho o de largo — por debajo de eso se
            considera desperdicio, no un retal nuevo). También se pueden registrar retales sueltos a mano
            con <strong>➕ Registrar retal manual</strong>, por ejemplo si Diego encuentra una pieza que no
            quedó en el sistema.
          </p>
          <p>
            Un retal <strong>disponible</strong> aparece como opción al buscar disponibilidad en{" "}
            <Ancla id="nuevo-pedido">Nuevo pedido</Ancla>; al usarse en un corte queda marcado como no
            disponible (no se borra, para no perder trazabilidad).
          </p>
        </Seccion>

        <Seccion id="nuevo-pedido" titulo="Nuevo pedido">
          <p>Este es el flujo principal del día a día. Paso a paso:</p>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-neutral-700">
            <li>Elige <strong>Línea</strong> y <strong>Referencia</strong> del material que pide el cliente.</li>
            <li>
              Escribe el <strong>ancho</strong> y <strong>largo</strong> solicitado (en mm) y presiona{" "}
              <strong>🔍 Buscar disponibilidad</strong>.
            </li>
            <li>
              El sistema muestra <strong>todas</strong> las opciones donde cabe esa pieza — rollos y
              retales — no solo la mejor. La marcada con <strong>⭐ Sugerida</strong> es la de menor
              desperdicio (primero intenta con retales existentes, y solo abre/avanza un rollo si no hay
              retal que alcance), y queda seleccionada por defecto. Puedes hacer clic en cualquier otra
              opción para cambiarla.
            </li>
            <li>
              Con una opción seleccionada aparece el <strong>plano de corte</strong> del rollo
              correspondiente, con los cortes que ya tiene. Si la opción es un rollo, se ve además un
              rectángulo punteado azul mostrando exactamente dónde caería la pieza nueva — se mueve en
              vivo si cambias las coordenadas. Si la opción es un retal, se muestra el plano del rollo del
              que salió, como referencia (la posición exacta del retal ya no queda marcada ahí, porque es
              una pieza suelta).
            </li>
            <li>
              Las <strong>coordenadas de corte</strong> (ancho, largo, X, Y) vienen prellenadas con lo que
              sugiere el motor, pero son <strong>editables</strong> — ajústalas si el operario va a cortar
              distinto.
            </li>
            <li>
              Completa <strong>Cliente</strong>, <strong>Número de pedido</strong> (solo números — se
              combina con la letra del cliente para formar el código, ej. <code>C-1234</code>) y{" "}
              <strong>Operario</strong>.
            </li>
            <li>
              Elige el <strong>Estado resultante</strong> del corte: normalmente VENDIDO; usa RETAL ÚTIL si
              lo que se corta en realidad es para guardar como retal, o ELIMINADO si es desperdicio que se
              registra por trazabilidad.
            </li>
            <li>
              <strong>Confirmar corte</strong> — queda registrado en el historial, el rollo o retal de
              origen se actualiza, y si sobra material aprovechable se genera un retal nuevo
              automáticamente.
            </li>
          </ol>
        </Seccion>

        <Seccion id="historial" titulo="Historial">
          <p>
            Bitácora completa de cortes — reemplaza la hoja <em>Historico_Cortes</em>. Cada fila es
            trazable: fecha, lote, pedido, cliente, medida, estado y operario. Clic en el lote para ir al
            plano de corte de ese rollo.
          </p>
        </Seccion>

        <Seccion id="anchos" titulo="Análisis de anchos">
          <p>
            Ranking de qué anchos (mm) se venden más, con base en el histórico de ventas —
            reemplaza <em>Analisis Anchos Malla teflon Cafe.xlsx</em>. Sirve para decidir qué anchos
            conviene tener pre-cortados en stock en vez de cortar siempre a medida.
          </p>
        </Seccion>

        <Seccion id="planeacion" titulo="Planeación de inventario">
          <p>
            Esta página junta tres cosas: <strong>planeación de demanda</strong>, <strong>punto de
            reorden</strong> y <strong>planeación de pedidos</strong>, por cada línea+referencia:
          </p>
          <Lista
            items={[
              <><strong>Demanda diaria</strong>: promedio de m² vendidos por día, calculado sobre los últimos 90 días de cortes reales.</>,
              <><strong>Stock actual</strong>: m² disponibles ahora mismo, sumando lo que queda en rollos activos más los retales disponibles de esa referencia.</>,
              <><strong>Lead time</strong> (tiempo de reposición del proveedor, en días) y <strong>cobertura objetivo</strong> (días extra que se quieren cubrir al pedir) y <strong>stock de seguridad</strong> (colchón manual en m²): estos tres los calibra un Administrador o Almacén por referencia — editables directo en la tabla, se recalculan en vivo mientras escribes.</>,
              <><strong>Punto de reorden</strong>: demanda diaria × lead time + stock de seguridad. Si el stock actual cae por debajo de esto, toca pedir ya.</>,
              <><strong>Nivel objetivo</strong>: hasta dónde se quiere llegar al pedir (punto de reorden + demanda × cobertura objetivo).</>,
              <><strong>Pedir ahora</strong>: cuánto pedir para llegar del stock actual al nivel objetivo.</>,
              <><strong>Estado</strong>: ⚠️ Reordenar (stock bajo el punto de reorden), ✓ OK, o Sin demanda (no se ha vendido nada en 90 días — no genera alerta para evitar falsos positivos).</>,
            ]}
          />
          <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Importante: lead time/cobertura/stock de seguridad arrancan en 30 días / 30 días / 0 m² por
            defecto para toda referencia nueva. Esos números son un punto de partida, no datos reales del
            proveedor — hay que calibrarlos con la información real de cada proveedor para que las alertas
            sean confiables.
          </p>
        </Seccion>

        <Seccion id="maestros" titulo="Clientes, proveedores, líneas, operarios">
          <p>Estos 4 catálogos alimentan los desplegables del resto de la app:</p>
          <Lista
            items={[
              <><strong>Clientes</strong>: cada uno tiene una letra de referencia única que se antepone al número de pedido (ej. IBELTCO = letra C → pedido C-1234).</>,
              <><strong>Proveedores</strong>: de dónde llegó cada rollo.</>,
              <><strong>Tipos de línea</strong>: las categorías de material (PVC, PU, malla teflón, etc.) que se usan al registrar rollos, retales y pedidos.</>,
              <><strong>Operarios</strong>: quién hizo cada corte.</>,
            ]}
          />
          <p>Cada uno se administra igual: agregar, editar o marcar Inactivo (no se borra el histórico).</p>
        </Seccion>

        <Seccion id="usuarios" titulo="Usuarios (solo Administrador)">
          <p>
            Solo los usuarios con rol <strong>Administrador</strong> pueden entrar aquí. Desde esta página
            se crean los usuarios de la app y se decide, persona por persona, qué páginas puede ver cada
            quien:
          </p>
          <Lista
            items={[
              <><strong>Roles</strong>: Administrador (ve y administra todo, incluyendo Usuarios), Almacén (operación e inventario, sin gestión de usuarios) y Operario (solo lo necesario para cortar: Rollos, Retales, Nuevo pedido, Historial).</>,
              <>El rol solo aplica un <strong>set de páginas sugerido</strong> al crear el usuario — el administrador puede marcar o desmarcar páginas individuales para esa persona en cualquier momento, sin importar el rol.</>,
              <>Al crear un usuario, si no se escribe una contraseña se genera una automática — se muestra una sola vez, cópiala antes de cerrar esa ventana.</>,
              <><strong>Resetear contraseña</strong> genera una nueva para alguien que la olvidó (también se muestra una sola vez).</>,
              <>Marcar un usuario <strong>Inactivo</strong> le corta el acceso de inmediato, sin necesidad de eliminarlo.</>,
            ]}
          />
        </Seccion>

        <Seccion id="mi-cuenta" titulo="Mi cuenta">
          <p>
            Desde el link <strong>Mi cuenta</strong> en la parte superior, cualquier usuario puede cambiar
            su propia contraseña (pide la contraseña actual, más la nueva dos veces).
          </p>
        </Seccion>

        <Seccion id="glosario" titulo="Glosario">
          <dl className="space-y-3 text-sm">
            <Termino termino="Lote">Código único de un rollo (ej. PVC3B - R1).</Termino>
            <Termino termino="Retal">Pieza sobrante de un corte, controlada individualmente como inventario propio.</Termino>
            <Termino termino="Franja / plano de corte">Cómo se acomodan las piezas dentro de un rollo: se apilan en franjas a lo largo del rollo, y dentro de cada franja se acomodan una junto a otra a lo ancho.</Termino>
            <Termino termino="X, Y">Coordenadas de dónde empieza una pieza dentro del rollo — X a lo ancho, Y a lo largo.</Termino>
            <Termino termino="m²">Metros cuadrados — unidad usada en Planeación para comparar referencias sin depender de un ancho de rollo fijo.</Termino>
            <Termino termino="Punto de reorden">Nivel de stock por debajo del cual hay que volver a pedir.</Termino>
            <Termino termino="Lead time">Tiempo que tarda el proveedor en entregar un pedido nuevo, en días.</Termino>
          </dl>
        </Seccion>

        <p className="text-xs text-neutral-400">
          ¿Falta algo o encontraste un error en este manual? Avísale a quien administra la app —{" "}
          <Link href="/" className="link-brand">volver al inicio</Link>.
        </p>
      </div>
    </div>
  );
}

function Seccion({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 space-y-3">
      <h2 className="text-lg font-semibold text-brand-900">{titulo}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-neutral-700">{children}</div>
    </section>
  );
}

function Lista({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 text-sm text-neutral-700">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function Ancla({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <a href={`#${id}`} className="link-brand">
      {children}
    </a>
  );
}

function Termino({ termino, children }: { termino: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-medium text-neutral-900">{termino}</dt>
      <dd className="text-neutral-600">{children}</dd>
    </div>
  );
}
