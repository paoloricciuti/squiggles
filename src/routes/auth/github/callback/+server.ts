import {
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET,
	JWT_SECRET,
	REDIRECT_BASE_URL
} from '$env/static/private';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { SignJWT } from 'jose';
import type { RequestHandler } from './$types';

interface GitHubUser {
	id: number;
	login: string;
	avatar_url: string;
}

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');

	const stored_state = cookies.get('github_oauth_state');
	const code_verifier = cookies.get('github_code_verifier');

	if (state !== stored_state) {
		error(400, 'Invalid state parameter');
	}

	if (!code) {
		error(400, 'Authorization code not provided');
	}

	if (!code_verifier) {
		error(400, 'Code verifier not found');
	}

	if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || !JWT_SECRET) {
		error(500, 'GitHub OAuth not properly configured');
	}

	try {
		// Clear the stored cookies
		cookies.delete('github_oauth_state', { path: '/' });
		cookies.delete('github_code_verifier', { path: '/' });

		// Exchange code for access token with PKCE
		const token_response = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				client_id: GITHUB_CLIENT_ID,
				client_secret: GITHUB_CLIENT_SECRET,
				code,
				code_verifier
			})
		});

		const token_data = await token_response.json();

		const access_token = token_data.access_token;

		if (!access_token) {
			error(401, 'Failed to get access token from GitHub');
		}

		// Get user info from GitHub
		const user_response = await fetch('https://api.github.com/user', {
			headers: {
				Authorization: `Bearer ${access_token}`,
				Accept: 'application/vnd.github.v3+json',
				'User-Agent': 'Squiggles-Notes-App'
			}
		});

		const github_user: GitHubUser = await user_response.json();

		// Check if user exists in database
		let user = await db.select().from(users).where(eq(users.github_id, github_user.id)).get();

		if (!user) {
			// Create new user
			const [newUser] = await db
				.insert(users)
				.values({
					github_id: github_user.id,
					username: github_user.login,
					avatar_url: github_user.avatar_url
				})
				.returning();
			user = newUser;
		}

		// Create JWT session token
		const secret = new TextEncoder().encode(JWT_SECRET);
		const session_token = await new SignJWT({ user_id: user.id, username: user.username })
			.setProtectedHeader({ alg: 'HS256' })
			.setIssuedAt()
			.setExpirationTime('7d')
			.sign(secret);

		// Set session cookie
		cookies.set('session', session_token, {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7 // 7 days
		});
	} catch (err) {
		console.error('GitHub OAuth error:', err);
		error(500, 'Authentication failed');
	}
	let redirect_to = '/notes';
	try {
		const return_to = new URL(state);
		if (return_to.origin === REDIRECT_BASE_URL) {
			redirect_to = return_to.toString();
		}
	} catch {
		/** empty */
	}
	redirect(302, redirect_to);
};
