import { redirect } from '@sveltejs/kit';
import { get_session } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { notes, users } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function load({ route, depends }) {
	depends('app:notes');
	const session = await get_session();

	// Get user's notes
	const user_notes = await db
		.select()
		.from(notes)
		.where(eq(notes.user_id, session.user_id))
		.orderBy(desc(notes.updated_at));

	// If there are notes, redirect to the most recent one
	if (user_notes.length > 0 && route.id === '/notes') {
		throw redirect(302, `/notes/${user_notes[0].id}`);
	}

	// Get full user data for empty state
	const user = await db.select().from(users).where(eq(users.id, session.user_id)).get();

	if (!user) {
		throw redirect(302, '/');
	}

	return {
		user,
		notes: user_notes
	};
}
