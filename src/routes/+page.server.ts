import { get_session } from '$lib/server/auth';
import { isRedirect, redirect } from '@sveltejs/kit';

export async function load() {
	console.log('Loading notes layout...');
	try {
		await get_session();
		redirect(302, `/notes`);
	} catch (e) {
		if (isRedirect(e)) {
			redirect(302, '/notes');
		}
	}
}
