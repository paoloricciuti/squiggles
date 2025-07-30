import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	github_id: integer('github_id').notNull().unique(),
	username: text('username').notNull(),
	avatar_url: text('avatar_url'),
	created_at: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const notes = sqliteTable('notes', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	user_id: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	title: text('title').notNull().default('Untitled'),
	content: text('content').notNull().default(''),
	created_at: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updated_at: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const clients = sqliteTable('mcp_clients', {
	client_id: text('client_id').primaryKey(),
	client_secret: text('client_secret'),
	client_id_issued_at: integer('client_id_issued_at'),
	client_secret_expires_at: integer('client_secret_expires_at'),
	redirect_uris: text('redirect_uris', { mode: 'json' }).notNull().$type<string[]>(),
	token_endpoint_auth_method: text('token_endpoint_auth_method'),
	grant_types: text('grant_types', { mode: 'json' }).$type<string[]>(),
	response_types: text('response_types', { mode: 'json' }).$type<string[]>(),
	client_name: text('client_name'),
	client_uri: text('client_uri'),
	logo_uri: text('logo_uri'),
	scope: text('scope'),
	contacts: text('contacts', { mode: 'json' }).$type<string[]>(),
	tos_uri: text('tos_uri'),
	policy_uri: text('policy_uri'),
	jwks_uri: text('jwks_uri'),
	software_id: text('software_id'),
	software_version: text('software_version'),
	created_at: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updated_at: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const codes = sqliteTable('mcp_codes', {
	code: text('code').primaryKey(),
	user_id: integer('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	client_id: text('client_id').notNull(),
	redirect_uri: text('redirect_uri').notNull(),
	code_challenge: text('code_challenge'),
	code_challenge_method: text('code_challenge_method'),
	expires_at: integer('expires_at').notNull(),
	scopes: text('scopes', { mode: 'json' }).notNull().$type<string[]>(),
	created_at: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updated_at: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const tokens = sqliteTable('mcp_tokens', {
	token: text('token').primaryKey(), // Access/refresh token as primary key
	client_id: text('client_id').notNull(),
	scopes: text('scopes', { mode: 'json' }).notNull().$type<string[]>(),
	expires_at: integer('expires_at').notNull(),
	created_at: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updated_at: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export const refresh_tokens = sqliteTable('mcp_refresh_tokens', {
	refresh_token: text('refresh_token').primaryKey(),
	client_id: text('client_id').notNull(),
	scopes: text('scopes', { mode: 'json' }).notNull().$type<string[]>(),
	access_token: text('access_token').notNull(),
	created_at: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updated_at: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date())
});

export type Note = typeof notes.$inferSelect;
