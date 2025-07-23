import { get_session } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { notes } from '$lib/server/db/schema';
import { error, json } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

export async function PUT({ params, request }) {
	const session = await get_session();

	const note_id = parseInt(params.id);
	const { title, content } = await request.json();

	// Update note only if it belongs to the user
	const [updated_note] = await db
		.update(notes)
		.set({
			title,
			content,
			updated_at: new Date()
		})
		.where(and(eq(notes.id, note_id), eq(notes.user_id, session.user_id)))
		.returning();

	if (!updated_note) {
		throw error(404, 'Note not found');
	}

	return json(updated_note);
}
