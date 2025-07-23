import { get_session } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { notes } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

export const actions = {
	async create() {
		const session = await get_session();

		const [new_note] = await db
			.insert(notes)
			.values({
				user_id: session.user_id,
				title: 'Untitled',
				content: ''
			})
			.returning();

		redirect(302, `/notes/${new_note.id}`);
	},
	async delete({ request }) {
		const session = await get_session();

		const form_data = await request.formData();
		const id = form_data.get('id')?.toString();
		const current = form_data.has('current');

		if (!id) {
			return fail(400, { error: 'Note ID is required' });
		}

		await db.delete(notes).where(and(eq(notes.id, +id), eq(notes.user_id, session.user_id)));
		if (current) {
			redirect(302, '/notes');
		}
	}
};
