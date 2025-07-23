import { getRequestEvent } from '$app/server';
import { JWT_SECRET } from '$env/static/private';
import { redirect } from '@sveltejs/kit';
import { jwtVerify } from 'jose';

export interface SessionData {
	user_id: number;
	username: string;
}

export async function get_session() {
	const { cookies } = getRequestEvent();
	const session_token = cookies.get('session');

	if (!session_token || !JWT_SECRET) {
		redirect(302, '/');
	}

	try {
		const secret = new TextEncoder().encode(JWT_SECRET);
		const { payload } = await jwtVerify(session_token, secret);

		return {
			user_id: payload.user_id as number,
			username: payload.username as string
		};
	} catch {
		redirect(302, '/');
	}
}
