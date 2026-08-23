CREATE TABLE "audit_events" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"metadata" jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_status_history" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"from_status" text NOT NULL,
	"to_status" text NOT NULL,
	"user" text NOT NULL,
	"reason" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" text PRIMARY KEY NOT NULL,
	"incident_id" text NOT NULL,
	"detection_id" text,
	"asset_id" text,
	"status" text NOT NULL,
	"priority_score" double precision,
	"priority_breakdown" jsonb,
	"review_state" text NOT NULL,
	"owner" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "critical_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"location" jsonb NOT NULL,
	"criticality_score" integer NOT NULL,
	"population_exposure_tier" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "detections" (
	"id" text PRIMARY KEY NOT NULL,
	"incident_id" text NOT NULL,
	"imagery_id" text,
	"geometry" jsonb NOT NULL,
	"class" text NOT NULL,
	"severity" text NOT NULL,
	"confidence" double precision NOT NULL,
	"model_name" text NOT NULL,
	"model_version" text NOT NULL,
	"inference_timestamp" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evidence" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"type" text NOT NULL,
	"uri" text NOT NULL,
	"source" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "field_observations" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"task_id" text,
	"location" jsonb,
	"media" jsonb,
	"notes" text,
	"verification_status" text NOT NULL,
	"sync_status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "imagery_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"incident_id" text NOT NULL,
	"filename" text NOT NULL,
	"source" text NOT NULL,
	"acquisition_time" timestamp NOT NULL,
	"capture_type" text,
	"geometry" jsonb,
	"quality_status" text,
	"storage_path" text NOT NULL,
	"metadata" jsonb,
	"processing_status" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"disaster_type" text NOT NULL,
	"status" text NOT NULL,
	"start_time" timestamp,
	"end_time" timestamp,
	"aoi" jsonb,
	"source" text,
	"description" text,
	"severity" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outcomes" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"action" text NOT NULL,
	"result" text NOT NULL,
	"evidence" jsonb,
	"completed_by" text NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"reviewer" text NOT NULL,
	"decision" text NOT NULL,
	"reason" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"case_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"priority" integer NOT NULL,
	"assigned_team" text,
	"assigned_user" text,
	"status" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"due_at" timestamp,
	"escalation_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" text NOT NULL,
	"organization_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_status_history" ADD CONSTRAINT "case_status_history_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_status_history" ADD CONSTRAINT "case_status_history_user_users_id_fk" FOREIGN KEY ("user") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_detection_id_detections_id_fk" FOREIGN KEY ("detection_id") REFERENCES "public"."detections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_asset_id_critical_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."critical_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_owner_users_id_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detections" ADD CONSTRAINT "detections_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "detections" ADD CONSTRAINT "detections_imagery_id_imagery_assets_id_fk" FOREIGN KEY ("imagery_id") REFERENCES "public"."imagery_assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_observations" ADD CONSTRAINT "field_observations_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "field_observations" ADD CONSTRAINT "field_observations_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "imagery_assets" ADD CONSTRAINT "imagery_assets_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcomes" ADD CONSTRAINT "outcomes_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outcomes" ADD CONSTRAINT "outcomes_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_users_id_fk" FOREIGN KEY ("reviewer") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_user_users_id_fk" FOREIGN KEY ("assigned_user") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;