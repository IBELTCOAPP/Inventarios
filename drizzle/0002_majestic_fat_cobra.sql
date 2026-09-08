CREATE TABLE "sesiones" (
	"token" text PRIMARY KEY NOT NULL,
	"usuario_id" integer NOT NULL,
	"expira_en" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"rol" text DEFAULT 'Operario' NOT NULL,
	"paginas_permitidas" text[] DEFAULT '{}' NOT NULL,
	"estado" text DEFAULT 'Activo' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "usuarios_email_unique" UNIQUE("email")
);
