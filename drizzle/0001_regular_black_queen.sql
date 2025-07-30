CREATE TABLE `mcp_clients` (
	`client_id` text PRIMARY KEY NOT NULL,
	`client_secret` text,
	`client_id_issued_at` integer,
	`client_secret_expires_at` integer,
	`redirect_uris` text NOT NULL,
	`token_endpoint_auth_method` text,
	`grant_types` text,
	`response_types` text,
	`client_name` text,
	`client_uri` text,
	`logo_uri` text,
	`scope` text,
	`contacts` text,
	`tos_uri` text,
	`policy_uri` text,
	`jwks_uri` text,
	`software_id` text,
	`software_version` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mcp_codes` (
	`code` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`redirect_uri` text NOT NULL,
	`code_challenge` text,
	`code_challenge_method` text,
	`expires_at` integer NOT NULL,
	`scopes` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mcp_refresh_tokens` (
	`refresh_token` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`scopes` text NOT NULL,
	`access_token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mcp_tokens` (
	`token` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`scopes` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
