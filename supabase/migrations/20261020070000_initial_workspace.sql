CREATE TABLE "issues" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"status" text NOT NULL,
	"priority" text NOT NULL,
	"label" text NOT NULL,
	"assignee" text,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"user_id" text,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"description" text NOT NULL,
	"color" text NOT NULL,
	"owner_id" text NOT NULL,
	"issue_counter" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milestones" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" text NOT NULL,
	"status" text NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"task_id" text,
	"name" text NOT NULL,
	"size" integer NOT NULL,
	"type" text NOT NULL,
	"url" text NOT NULL,
	"caption" text,
	"uploader_name" text NOT NULL,
	"uploader_email" text NOT NULL,
	"is_client_visible" integer DEFAULT 1 NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"sender_id" text NOT NULL,
	"sender_name" text NOT NULL,
	"sender_email" text NOT NULL,
	"sender_role" text NOT NULL,
	"content" text NOT NULL,
	"attachments_json" text,
	"reply_to_id" text,
	"is_client_visible" integer DEFAULT 1 NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"recipient_email" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"project_id" text,
	"issue_id" text,
	"read" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "issues" ADD CONSTRAINT "issues_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "issue_number" ON "issues" USING btree ("project_id","number");
--> statement-breakpoint
CREATE UNIQUE INDEX "member_email" ON "members" USING btree ("project_id","email");
--> statement-breakpoint
-- Browser clients use Supabase Auth only. All project operations pass through
-- the Next.js API, which checks verified identity and project roles.
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.projects, public.members, public.issues, public.milestones, public.attachments, public.chat_messages, public.notifications FROM anon, authenticated;
