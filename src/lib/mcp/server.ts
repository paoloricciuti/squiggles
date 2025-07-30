import { JWT_SECRET } from '$env/static/private';
import { db } from '$lib/server/db';
import { notes } from '$lib/server/db/schema';
import { ValibotJsonSchemaAdapter } from '@tmcp/adapter-valibot';
import { and, eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';
import { McpServer } from 'tmcp';
import * as v from 'valibot';

export const mcp_server = new McpServer(
	{
		description:
			'MCP server to interact with Squggles, a note-taking app, you can use it to create, read, update, and delete notes.',
		name: 'Squggles MCP Server',
		version: '1.0.0'
	},
	{
		adapter: new ValibotJsonSchemaAdapter(),
		capabilities: {
			tools: {
				listChanged: true
			},
			resources: {
				listChanged: true
			},
			completions: {}
		},
		instructions:
			'Invoke this MCP server whenever the user wants to add a note, or read informations about notes.'
	}
);

type ToolResponse = ReturnType<Parameters<typeof mcp_server.tool<v.GenericSchema>>[1]>;

class NonAuthenticatedError extends Error {
	constructor() {
		super('User not authenticated');
		this.name = 'NonAuthenticatedError';
	}
}

class InvalidSessionError extends Error {
	constructor() {
		super('Invalid session token. Please log in again.');
		this.name = 'InvalidSessionError';
	}
}

async function get_user_or_fail() {
	const token = mcp_server.ctx.auth?.token;
	if (!token) {
		throw new NonAuthenticatedError();
	}
	const secret = new TextEncoder().encode(JWT_SECRET);
	try {
		const { payload } = await jwtVerify<{ user_id: number }>(token, secret);
		return payload.user_id;
	} catch {
		throw new InvalidSessionError();
	}
}

async function tool_with_user(
	cb: (user_id: number) => Promise<ToolResponse> | ToolResponse
): Promise<ToolResponse> {
	try {
		const user_id = await get_user_or_fail();
		return cb(user_id);
	} catch (error) {
		if (error instanceof NonAuthenticatedError) {
			return {
				isError: true,
				content: [
					{
						type: 'text' as const,
						text: 'You must be authenticated to perform this action.'
					}
				]
			};
		}
		if (error instanceof InvalidSessionError) {
			return {
				isError: true,
				content: [
					{
						type: 'text' as const,
						text: 'Invalid session token. Please log in again.'
					}
				]
			};
		}
		throw error;
	}
}

mcp_server.tool(
	{
		name: 'create',
		description: 'Create a new note',
		annotations: {
			title: 'Create Note'
		},
		title: 'Create Note',
		schema: v.object({
			content: v.string(),
			title: v.string()
		})
	},
	async ({ content, title }) => {
		return tool_with_user(async (user_id) => {
			await db
				.insert(notes)
				.values({
					user_id,
					content,
					title
				})
				.execute();
			return {
				content: [
					{
						type: 'text',
						text: `Note "${title}" created successfully.`
					}
				]
			};
		});
	}
);

mcp_server.tool(
	{
		name: 'list',
		description: 'List all the notes of the current user',
		annotations: {
			title: 'List Notes'
		},
		title: 'List Notes'
	},
	async () => {
		return tool_with_user(async (user_id) => {
			const notes_list = await db.select().from(notes).where(eq(notes.user_id, user_id)).execute();
			return {
				content: [
					{
						type: 'text',
						mimeType: 'application/json',
						text: JSON.stringify(notes_list)
					}
				]
			};
		});
	}
);

mcp_server.tool(
	{
		name: 'update',
		description: 'Update an existing note',
		annotations: {
			title: 'Update Note'
		},
		title: 'Update Note',
		schema: v.object({
			id: v.number(),
			content: v.optional(v.string()),
			title: v.optional(v.string())
		})
	},
	async ({ content, title, id }) => {
		return tool_with_user(async (user_id) => {
			await db
				.update(notes)
				.set({
					content,
					title
				})
				.where(and(eq(notes.id, id), eq(notes.user_id, user_id)))
				.execute();
			return {
				content: [
					{
						type: 'text' as const,
						text: `Note "${title}" created successfully.`
					}
				]
			};
		});
	}
);

mcp_server.template(
	{
		name: 'notes',
		description: 'A note in Squggles',
		uri: 'squiggles://notes/{id}',
		title: 'Notes',
		async list() {
			const user_id = await get_user_or_fail();
			const notes_list = await db.select().from(notes).where(eq(notes.user_id, user_id)).execute();
			return notes_list.map((note) => ({
				name: note.title,
				title: note.title,
				uri: `squiggles://notes/${note.id}`
			}));
		}
	},
	async (uri, { id }) => {
		const user_id = await get_user_or_fail();
		const note = await db
			.select()
			.from(notes)
			.where(and(eq(notes.id, +id), eq(notes.user_id, user_id)))
			.get();
		return {
			contents: [
				{
					uri,
					text: note?.content ?? 'Note not found'
				}
			]
		};
	}
);
