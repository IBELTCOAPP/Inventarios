CREATE TABLE "politicas_inventario" (
	"id" serial PRIMARY KEY NOT NULL,
	"linea" text NOT NULL,
	"referencia" text NOT NULL,
	"lead_time_dias" integer DEFAULT 30 NOT NULL,
	"dias_cobertura_objetivo" integer DEFAULT 30 NOT NULL,
	"stock_seguridad_m2" double precision DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "cortes" ADD COLUMN "linea" text;--> statement-breakpoint
ALTER TABLE "cortes" ADD COLUMN "referencia" text;