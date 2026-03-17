CREATE TABLE "admin_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"admin_id" uuid NOT NULL,
	"app" varchar(32),
	"device" varchar(128),
	"os" varchar(32),
	"os_version" varchar(32),
	"ip" varchar(64),
	"user_agent" text,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"last_active_at" timestamp with time zone,
	"logged_out_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_sessions_status_check" CHECK ("admin_sessions"."status" IN ('active', 'logged_out', 'kicked'))
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY NOT NULL,
	"username" varchar(64) NOT NULL,
	"password_hash" text NOT NULL,
	"nickname" varchar(64),
	"email" varchar(128),
	"role" varchar(32) DEFAULT 'admin' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admins_username_unique" UNIQUE("username"),
	CONSTRAINT "admins_role_check" CHECK ("admins"."role" IN ('super_admin', 'admin', 'operator', 'developer'))
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" uuid PRIMARY KEY NOT NULL,
	"sn" varchar(64) NOT NULL,
	"model" varchar(64),
	"batch" varchar(64),
	"manufactured_at" timestamp with time zone,
	"activated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "devices_sn_unique" UNIQUE("sn")
);
--> statement-breakpoint
CREATE TABLE "pet_devices" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pet_id" uuid NOT NULL,
	"device_id" uuid NOT NULL,
	"status" varchar(16) DEFAULT 'bound' NOT NULL,
	"bound_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unbound_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pet_devices_status_check" CHECK ("pet_devices"."status" IN ('bound', 'unbound'))
);
--> statement-breakpoint
CREATE TABLE "pet_lost_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"pet_id" uuid NOT NULL,
	"lost_at" timestamp with time zone,
	"latitude" double precision,
	"longitude" double precision,
	"country" varchar(64),
	"province" varchar(64),
	"city" varchar(64),
	"address" text,
	"description" text,
	"status" varchar(16) DEFAULT 'lost' NOT NULL,
	"found_at" timestamp with time zone,
	"found_remark" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pet_lost_events_status_check" CHECK ("pet_lost_events"."status" IN ('lost', 'found'))
);
--> statement-breakpoint
CREATE TABLE "pets" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(64) NOT NULL,
	"avatar" text,
	"gender" varchar(8),
	"breed" varchar(64),
	"description" text,
	"contacts" jsonb,
	"contact_name" varchar(64),
	"remark" text,
	"images" jsonb,
	"status" varchar(16) DEFAULT 'normal' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pets_gender_check" CHECK ("pets"."gender" IN ('male', 'female', 'unknown')),
	CONSTRAINT "pets_status_check" CHECK ("pets"."status" IN ('normal', 'lost'))
);
--> statement-breakpoint
CREATE TABLE "scan_logs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"device_id" uuid NOT NULL,
	"device_sn" varchar(64),
	"ip" "inet",
	"user_agent" text,
	"latitude" double precision,
	"longitude" double precision,
	"accuracy" integer,
	"country" varchar(64),
	"province" varchar(64),
	"city" varchar(64),
	"address" text,
	"poi_name" varchar(128),
	"location_source" varchar(16),
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_auths" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" varchar(32) NOT NULL,
	"open_id" varchar(128) NOT NULL,
	"union_id" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_devices" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"device_id" uuid NOT NULL,
	"status" varchar(16) DEFAULT 'bound' NOT NULL,
	"bound_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unbound_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_devices_status_check" CHECK ("user_devices"."status" IN ('bound', 'unbound'))
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"app" varchar(32),
	"device_type" varchar(32),
	"device" varchar(128),
	"os" varchar(32),
	"os_version" varchar(32),
	"ip" varchar(64),
	"user_agent" text,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"last_active_at" timestamp with time zone,
	"logged_out_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_status_check" CHECK ("user_sessions"."status" IN ('active', 'logged_out', 'kicked'))
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"nickname" varchar(64),
	"avatar" text,
	"phone" varchar(20),
	"email" varchar(128),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pet_devices" ADD CONSTRAINT "pet_devices_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pet_devices" ADD CONSTRAINT "pet_devices_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pet_lost_events" ADD CONSTRAINT "pet_lost_events_pet_id_pets_id_fk" FOREIGN KEY ("pet_id") REFERENCES "public"."pets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pets" ADD CONSTRAINT "pets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scan_logs" ADD CONSTRAINT "scan_logs_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_auths" ADD CONSTRAINT "user_auths_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_devices" ADD CONSTRAINT "user_devices_device_id_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admin_sessions_admin_id" ON "admin_sessions" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_devices_batch" ON "devices" USING btree ("batch");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_pet_devices_active" ON "pet_devices" USING btree ("device_id") WHERE "pet_devices"."status" = 'bound';--> statement-breakpoint
CREATE INDEX "idx_pet_devices_pet_id" ON "pet_devices" USING btree ("pet_id");--> statement-breakpoint
CREATE INDEX "idx_pet_devices_device_id" ON "pet_devices" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "idx_pet_lost_events_pet_id" ON "pet_lost_events" USING btree ("pet_id");--> statement-breakpoint
CREATE INDEX "idx_pets_user_id" ON "pets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_scan_logs_device_id" ON "scan_logs" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "idx_scan_logs_scanned_at" ON "scan_logs" USING btree ("scanned_at");--> statement-breakpoint
CREATE INDEX "idx_scan_logs_device_time" ON "scan_logs" USING btree ("device_id","scanned_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_user_auths_provider_open_id" ON "user_auths" USING btree ("provider","open_id");--> statement-breakpoint
CREATE INDEX "idx_user_auths_user_id" ON "user_auths" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_user_devices_active" ON "user_devices" USING btree ("device_id") WHERE "user_devices"."status" = 'bound';--> statement-breakpoint
CREATE INDEX "idx_user_devices_user_id" ON "user_devices" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_devices_device_id" ON "user_devices" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "idx_user_sessions_user_id" ON "user_sessions" USING btree ("user_id");