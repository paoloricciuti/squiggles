import { redirect } from '@sveltejs/kit';

export async function load({ params, parent }) {
	const { notes, user } = await parent();

	const selected_note = notes.find((note) => note.id === +params.id);

	if (!selected_note) {
		redirect(302, '/notes');
	}

	return {
		user,
		selected_note
	};
}

export const actions = {
	async save({ request, fetch, params: { id } }) {
		const form_data = await request.formData();
		const title = form_data.get('title')?.toString();
		const content = form_data.get('content')?.toString();

		if (!id || !title || !content) {
			return { error: 'All fields are required' };
		}

		try {
			const response = await fetch(`/api/notes/${id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ title, content })
			});

			if (!response.ok) {
				throw new Error('Failed to save note');
			}

			return { success: true };
		} catch (err) {
			console.error('Error saving note:', err);
			return { error: err };
		}
	}
};
