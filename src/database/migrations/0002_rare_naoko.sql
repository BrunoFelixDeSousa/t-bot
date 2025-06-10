CREATE TYPE "public"."game_status" AS ENUM('waiting', 'active', 'completed', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."game_type" AS ENUM('coin_flip', 'rock_paper_scissors', 'dice', 'domino');--> statement-breakpoint
CREATE TYPE "public"."match_type" AS ENUM('single_player', 'multiplayer', 'tournament');--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"creator_id" integer NOT NULL,
	"game_type" "game_type" NOT NULL,
	"match_type" "match_type" DEFAULT 'single_player' NOT NULL,
	"bet_amount" numeric(10, 2) NOT NULL,
	"status" "game_status" DEFAULT 'waiting' NOT NULL,
	"game_data" json,
	"winner_id" integer,
	"prize" numeric(10, 2),
	"rake_amount" numeric(10, 2),
	"expires_at" timestamp,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_winner_id_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;