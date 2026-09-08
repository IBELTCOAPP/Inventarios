CREATE TABLE "anchos_analisis" (
	"id" serial PRIMARY KEY NOT NULL,
	"ancho_mm" double precision NOT NULL,
	"pedidos" integer NOT NULL,
	"unidades_vendidas" integer NOT NULL,
	"pct_total" double precision NOT NULL,
	"pct_acumulado" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clientes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"letra" text NOT NULL,
	"nit" text,
	"contacto" text,
	"telefono" text,
	"estado" text DEFAULT 'Activo' NOT NULL,
	CONSTRAINT "clientes_letra_unique" UNIQUE("letra")
);
--> statement-breakpoint
CREATE TABLE "cortes" (
	"id" serial PRIMARY KEY NOT NULL,
	"lote" text NOT NULL,
	"fecha" timestamp with time zone DEFAULT now(),
	"pedido_taller" text,
	"cliente" text,
	"ancho_mm" double precision NOT NULL,
	"largo_mm" double precision NOT NULL,
	"area_mm2" double precision,
	"estado" text DEFAULT 'VENDIDO' NOT NULL,
	"operario" text,
	"x_inicial" double precision NOT NULL,
	"y_inicial" double precision NOT NULL,
	"origen_tipo" text DEFAULT 'rollo' NOT NULL,
	"origen_retal_id" integer,
	"nota" text
);
--> statement-breakpoint
CREATE TABLE "lineas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"estado" text DEFAULT 'Activo' NOT NULL,
	CONSTRAINT "lineas_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "operarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"estado" text DEFAULT 'Activo' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proveedores" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"contacto" text,
	"telefono" text,
	"estado" text DEFAULT 'Activo' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retales" (
	"id" serial PRIMARY KEY NOT NULL,
	"lote_origen" text NOT NULL,
	"linea" text NOT NULL,
	"referencia" text NOT NULL,
	"ancho_mm" double precision NOT NULL,
	"largo_mm" double precision NOT NULL,
	"disponible" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rollos" (
	"id" serial PRIMARY KEY NOT NULL,
	"lote" text NOT NULL,
	"linea" text NOT NULL,
	"referencia" text NOT NULL,
	"ancho_mm" double precision NOT NULL,
	"largo_mm" double precision NOT NULL,
	"largo_usado_mm" double precision DEFAULT 0 NOT NULL,
	"estado" text DEFAULT 'INICIADO' NOT NULL,
	"proveedor" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "rollos_lote_unique" UNIQUE("lote")
);
