import { GITHUB_CLIENT_ID, REDIRECT_BASE_URL } from '$env/static/private';
import { redirect } from '@sveltejs/kit';
import { generate_code_verifier, generate_code_challenge } from '$lib/server/pkce';

export async function GET({ cookies, url }) {
	if (!GITHUB_CLIENT_ID) {
		throw new Error('GITHUB_CLIENT_ID is not configured');
	}

	const return_to = url.searchParams.get('return_to');

	const state = return_to ?? crypto.randomUUID();
	const code_verifier = generate_code_verifier();
	const code_challenge = await generate_code_challenge(code_verifier);

	// Store state and code verifier in secure cookies
	cookies.set('github_oauth_state', state, {
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 5,
		path: '/',
		secure: false
	});

	cookies.set('github_code_verifier', code_verifier, {
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 5,
		path: '/',
		secure: false
	});

	const params = new URLSearchParams({
		client_id: GITHUB_CLIENT_ID,
		redirect_uri: `${REDIRECT_BASE_URL}/auth/github/callback`,
		scope: 'user:email',
		state,
		code_challenge,
		code_challenge_method: 'S256'
	});

	throw redirect(302, `https://github.com/login/oauth/authorize?${params.toString()}`);
}
