import { getRequestEvent } from '$app/server';
import { JWT_SECRET } from '$env/static/private';
import { error } from '@sveltejs/kit';
import { jwtVerify } from 'jose';

export interface SessionData {
	user_id: number;
	username: string;
}

export async function get_session() {
	const { cookies } = getRequestEvent();
	const session_token = cookies.get('session');

	if (!session_token || !JWT_SECRET) {
		error(401, 'Unauthorized');
	}

	try {
		const secret = new TextEncoder().encode(JWT_SECRET);
		const { payload } = await jwtVerify(session_token, secret);

		return {
			user_id: payload.user_id as number,
			username: payload.username as string
		};
	} catch {
		error(401, 'Unauthorized');
	}
}
