"use client";

import { useState, useTransition } from "react";
import { crearUsuario, actualizarUsuario, resetearPassword, eliminarUsuario } from "@/app/usuarios/actions";
import { PAGINAS, PAGINAS_POR_ROL, ROLES, ROL_LABEL, type PaginaKey, type Rol } from "@/lib/pages";

type Usuario = {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  paginasPermitidas: string[];
  estado: string;
};

// "usuarios" nunca se ofrece como checkbox — esa página queda reservada al
// rol Administrador siempre (ver requireAdministrador en lib/auth.ts).
const PAGINAS_ASIGNABLES = PAGINAS.filter((p) => p.key !== "usuarios");

export function UsuariosAdmin({ usuarios, miId }: { usuarios: Usuario[]; miId: number }) {
  const [editId, setEditId] = useState<number | null>(null);
  const [creando, setCreando] = useState(false);

  return (
    <div className="space-y-4">
      {!creando && editId === null && (
        <button type="button" className="btn-primary" onClick={() => setCreando(true)}>
          ➕ Nuevo usuario
        </button>
      )}

      {creando && <FormularioUsuario onCerrar={() => setCreando(false)} />}

      <div className="overflow-x-auto card">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-neutral-50 text-left text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Nombre</th>
              <th className="px-4 py-2 font-medium">Correo</th>
              <th className="px-4 py-2 font-medium">Rol</th>
              <th className="px-4 py-2 font-medium">Páginas</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {usuarios.map((u) =>
              editId === u.id ? (
                <tr key={u.id}>
                  <td colSpan={6} className="p-0">
                    <FormularioUsuario usuario={u} onCerrar={() => setEditId(null)} esYoMismo={u.id === miId} />
                  </td>
                </tr>
              ) : (
                <tr key={u.id} className="hover:bg-brand-50/60">
                  <td className="px-4 py-2 font-medium">
                    {u.nombre} {u.id === miId && <span className="text-xs text-neutral-400">(tú)</span>}
                  </td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{ROL_LABEL[u.rol as Rol] ?? u.rol}</td>
                  <td className="px-4 py-2 text-neutral-500">
                    {u.rol === "Administrador" ? "Todas" : u.paginasPermitidas.length === 0 ? "Ninguna" : `${u.paginasPermitidas.length} página(s)`}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.estado === "Activo" ? "bg-emerald-100 text-emerald-800" : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {u.estado}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <AccionesFila usuario={u} esYoMismo={u.id === miId} onEditar={() => setEditId(u.id)} />
                  </td>
                </tr>
              )
            )}
            {usuarios.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-neutral-400" colSpan={6}>
                  No hay usuarios todavía.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AccionesFila({
  usuario,
  esYoMismo,
  onEditar,
}: {
  usuario: Usuario;
  esYoMismo: boolean;
  onEditar: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [passwordGenerada, setPasswordGenerada] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function resetear() {
    if (!confirm(`¿Generar una contraseña nueva para ${usuario.nombre}? La actual dejará de servir.`)) return;
    setError(null);
    startTransition(async () => {
      const res = await resetearPassword(usuario.id);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPasswordGenerada(res.passwordTemporal ?? null);
    });
  }

  function eliminar() {
    if (!confirm(`¿Eliminar el usuario ${usuario.nombre}? No se puede deshacer.`)) return;
    startTransition(async () => {
      const res = await eliminarUsuario(usuario.id);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onEditar} className="link-brand">
          Editar
        </button>
        <button type="button" onClick={resetear} disabled={isPending} className="link-brand">
          Resetear contraseña
        </button>
        {!esYoMismo && (
          <button type="button" onClick={eliminar} disabled={isPending} className="text-red-700 underline">
            Eliminar
          </button>
        )}
      </div>
      {passwordGenerada && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Contraseña nueva de <strong>{usuario.nombre}</strong>: <code className="font-mono">{passwordGenerada}</code>
          <br />
          Cópiala ahora — no se vuelve a mostrar.
        </div>
      )}
      {error && <div className="text-xs text-red-700">{error}</div>}
    </div>
  );
}

function FormularioUsuario({
  usuario,
  esYoMismo,
  onCerrar,
}: {
  usuario?: Usuario;
  esYoMismo?: boolean;
  onCerrar: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [nombre, setNombre] = useState(usuario?.nombre ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [rol, setRol] = useState<Rol>((usuario?.rol as Rol) ?? "Operario");
  const [paginas, setPaginas] = useState<PaginaKey[]>((usuario?.paginasPermitidas as PaginaKey[]) ?? PAGINAS_POR_ROL.Operario);
  const [estado, setEstado] = useState(usuario?.estado ?? "Activo");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [passwordGenerada, setPasswordGenerada] = useState<string | null>(null);

  function alternarPagina(key: PaginaKey) {
    setPaginas((ps) => (ps.includes(key) ? ps.filter((p) => p !== key) : [...ps, key]));
  }

  function aplicarPaginasDelRol() {
    setPaginas(PAGINAS_POR_ROL[rol]);
  }

  function guardar() {
    setError(null);
    startTransition(async () => {
      if (usuario) {
        const res = await actualizarUsuario({ id: usuario.id, nombre, rol, paginasPermitidas: paginas, estado: estado as "Activo" | "Inactivo" });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        onCerrar();
      } else {
        const res = await crearUsuario({ nombre, email, rol, paginasPermitidas: paginas, password: password || undefined });
        if (!res.ok) {
          setError(res.error);
          return;
        }
        if (res.passwordTemporal) {
          setPasswordGenerada(res.passwordTemporal);
        } else {
          onCerrar();
        }
      }
    });
  }

  if (passwordGenerada) {
    return (
      <div className="card space-y-3 p-5">
        <p className="text-sm text-emerald-800">
          Usuario <strong>{nombre}</strong> creado. Su contraseña inicial es:
        </p>
        <code className="block rounded-md bg-neutral-100 px-3 py-2 font-mono text-sm">{passwordGenerada}</code>
        <p className="text-xs text-neutral-500">Cópiala y pásasela — no se vuelve a mostrar después de cerrar esto.</p>
        <button type="button" className="btn-secondary" onClick={onCerrar}>
          Listo
        </button>
      </div>
    );
  }

  return (
    <div className="card space-y-4 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre *">
          <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </Field>
        <Field label="Correo *">
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!usuario} />
        </Field>
        <Field label="Rol">
          <select className="input" value={rol} onChange={(e) => setRol(e.target.value as Rol)} disabled={!!esYoMismo}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROL_LABEL[r]}
              </option>
            ))}
          </select>
        </Field>
        {usuario ? (
          <Field label="Estado">
            <select className="input" value={estado} onChange={(e) => setEstado(e.target.value)} disabled={!!esYoMismo}>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </Field>
        ) : (
          <Field label="Contraseña inicial (opcional)">
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Vacío = se genera una automática"
            />
          </Field>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-neutral-600">
            Páginas que puede ver {rol === "Administrador" && "— Administrador ve todas siempre, esta selección no aplica"}
          </span>
          {rol !== "Administrador" && (
            <button type="button" onClick={aplicarPaginasDelRol} className="link-brand text-xs">
              Aplicar páginas por defecto de {ROL_LABEL[rol]}
            </button>
          )}
        </div>
        {rol !== "Administrador" && (
          <div className="grid grid-cols-2 gap-2 rounded-md border border-neutral-200 p-3 sm:grid-cols-3">
            {PAGINAS_ASIGNABLES.map((p) => (
              <label key={p.key} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={paginas.includes(p.key)} onChange={() => alternarPagina(p.key)} />
                {p.label}
              </label>
            ))}
          </div>
        )}
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="flex gap-2">
        <button type="button" onClick={guardar} disabled={isPending} className="btn-primary">
          {isPending ? "Guardando..." : usuario ? "Guardar cambios" : "Crear usuario"}
        </button>
        <button type="button" onClick={onCerrar} disabled={isPending} className="btn-secondary">
          Cancelar
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-neutral-600">{label}</span>
      {children}
    </label>
  );
}
