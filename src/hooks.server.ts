import { transport } from '$lib/mcp/transport';
import { redirect } from '@sveltejs/kit';

export async function handle({ resolve, event }) {
	const mcp_response = await transport.respond(event.request);
	if (mcp_response) {
		return mcp_response;
	}
	const response = await resolve(event);
	if (response.status === 401) {
		redirect(302, '/');
	}
	return response;
}
