import { redirect } from '@sveltejs/kit';
export async function handle({ resolve, event }) {
	const response = await resolve(event);
	if (response.status === 401) {
		redirect(302, '/');
	}
	return response;
}
