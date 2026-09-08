"use server";

import { destruirSesionActual } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function cerrarSesion() {
  await destruirSesionActual();
  redirect("/login");
}
