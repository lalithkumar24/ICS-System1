CREATE TYPE "public"."audit_status" AS ENUM('pending', 'in_progress', 'completed', 'failed', 'paused');--> statement-breakpoint
CREATE TYPE "public"."contract_type" AS ENUM('defi', 'nft', 'governance', 'token', 'bridge', 'other');--> statement-breakpoint
CREATE TYPE "public"."risk_level" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TABLE "audit_findings" (
	"id" serial PRIMARY KEY NOT NULL,
	"audit_id" integer,
	"title" varchar(255) NOT NULL,
	"description" text,
	"severity" "risk_level" NOT NULL,
	"category" varchar(100),
	"line_number" integer,
	"code_snippet" text,
	"recommendation" text,
	"status" varchar(50) DEFAULT 'open',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audit_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"audit_id" integer,
	"title" varchar(255) NOT NULL,
	"summary" text,
	"report_data" jsonb,
	"file_path" varchar,
	"generated_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "audits" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer,
	"auditor_id" varchar,
	"status" "audit_status" DEFAULT 'pending',
	"audit_type" varchar(100) DEFAULT 'comprehensive',
	"priority" varchar(20) DEFAULT 'standard',
	"progress" integer DEFAULT 0,
	"risk_score" numeric(3, 1),
	"findings_count" integer DEFAULT 0,
	"critical_issues" integer DEFAULT 0,
	"high_issues" integer DEFAULT 0,
	"medium_issues" integer DEFAULT 0,
	"low_issues" integer DEFAULT 0,
	"started_at" timestamp,
	"completed_at" timestamp,
	"notes" text,
	"configuration" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "smart_contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" varchar(42),
	"source_code" text,
	"compiler_version" varchar(50),
	"network" varchar(50) NOT NULL,
	"contract_type" "contract_type" DEFAULT 'other',
	"deployment_date" timestamp,
	"verified" boolean DEFAULT false,
	"uploaded_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "smart_contracts_address_unique" UNIQUE("address")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"hash" varchar(66) NOT NULL,
	"contract_address" varchar(42),
	"from_address" varchar(42),
	"to_address" varchar(42),
	"value" varchar,
	"gas_used" varchar,
	"gas_price" varchar,
	"block_number" varchar,
	"timestamp" timestamp,
	"risk_level" "risk_level" DEFAULT 'low',
	"flags" jsonb,
	"analyzed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "transactions_hash_unique" UNIQUE("hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" varchar DEFAULT 'auditor',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_findings" ADD CONSTRAINT "audit_findings_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_reports" ADD CONSTRAINT "audit_reports_audit_id_audits_id_fk" FOREIGN KEY ("audit_id") REFERENCES "public"."audits"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_reports" ADD CONSTRAINT "audit_reports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audits" ADD CONSTRAINT "audits_contract_id_smart_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."smart_contracts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audits" ADD CONSTRAINT "audits_auditor_id_users_id_fk" FOREIGN KEY ("auditor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smart_contracts" ADD CONSTRAINT "smart_contracts_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");