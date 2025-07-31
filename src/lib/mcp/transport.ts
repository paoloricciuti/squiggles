import { JWT_SECRET, REDIRECT_BASE_URL } from '$env/static/private';
import { mcp_server } from '$lib/mcp/server';
import { db } from '$lib/server/db';
import { clients, codes, refresh_tokens, tokens } from '$lib/server/db/schema';
import { SimpleProvider } from '@tmcp/auth';
import { HttpTransport } from '@tmcp/transport-http';
import { SseTransport } from '@tmcp/transport-sse';
import { eq } from 'drizzle-orm';
import { decodeJwt, jwtVerify, SignJWT } from 'jose';

type NullToUndefined<T> =
	T extends Record<string, unknown>
		? {
				[K in keyof T]: NullToUndefined<T[K]>;
			}
		: T extends null
			? undefined
			: T;

// weird shit to make types from drizzle behave
function null_to_undefined<T>(value: T): NullToUndefined<T> {
	return value as NullToUndefined<T>;
}

async function get_user_id(request: Request) {
	const cookies_header = request.headers.get('cookie');
	if (cookies_header) {
		const cookies = Object.fromEntries(
			cookies_header.split('; ').map((cookie) => {
				const { name, value } = cookie.match(/(?<name>[^=]+)=(?<value>[^;]+)/)?.groups ?? {};
				return [name, value];
			})
		);
		if (cookies.session) {
			const secret = new TextEncoder().encode(JWT_SECRET);
			const { payload } = await jwtVerify<{ user_id: number }>(cookies.session, secret);

			return payload.user_id;
		}
	}
}

const auth_provider = new SimpleProvider({
	clients: {
		async get(client_id) {
			const [client] = await db
				.select()
				.from(clients)
				.where(eq(clients.client_id, client_id))
				.execute();

			return null_to_undefined(client);
		},
		async register(client_info) {
			const client_id = Math.random().toString(36).substring(2, 15);
			const new_client = {
				...client_info,
				client_id,
				client_id_issued_at: Date.now()
			};
			await db.insert(clients).values(new_client).execute();
			return new_client;
		}
	},
	codes: {
		async redirect(request) {
			const user_id = await get_user_id(request);
			if (user_id) return null;
			return REDIRECT_BASE_URL + '/';
		},
		async get(code) {
			const [ret_code] = await db.select().from(codes).where(eq(codes.code, code)).execute();
			return null_to_undefined(ret_code);
		},
		async store(code, code_data, request) {
			const user_id = await get_user_id(request);
			if (!user_id) return;

			await db
				.insert(codes)
				.values({ ...code_data, code, user_id: user_id })
				.execute();
		},
		async delete(code) {
			await db.delete(codes).where(eq(codes.code, code)).execute();
		}
	},
	tokens: {
		async generate(token_data) {
			let user_id: number | undefined = undefined;
			if (token_data.kind === 'new') {
				const [code] = await db
					.select()
					.from(codes)
					.where(eq(codes.code, token_data.code))
					.execute();
				if (code) {
					user_id = code.user_id;
				}
			} else {
				user_id = decodeJwt<{ user_id: number }>(token_data.access_token).user_id;
			}
			if (!user_id) return;

			const secret = new TextEncoder().encode(JWT_SECRET);
			const session_token = await new SignJWT({ user_id })
				.setProtectedHeader({ alg: 'HS256' })
				.setIssuedAt()
				.setExpirationTime('7d')
				.sign(secret);

			return session_token;
		},
		async get(token) {
			const [ret_token] = await db.select().from(tokens).where(eq(tokens.token, token)).execute();
			return null_to_undefined(ret_token);
		},
		async store(token, token_data) {
			await db
				.insert(tokens)
				.values({ ...token_data, token })
				.execute();
		},
		async delete(token) {
			await db.delete(tokens).where(eq(tokens.token, token)).execute();
		}
	},
	refreshTokens: {
		async generate(refresh_token_data) {
			let user_id: number | undefined = undefined;
			if (refresh_token_data.kind === 'new') {
				const [code] = await db
					.select()
					.from(codes)
					.where(eq(codes.code, refresh_token_data.code))
					.execute();
				if (code) {
					user_id = code.user_id;
				}
			} else {
				user_id = decodeJwt<{ user_id: number }>(refresh_token_data.access_token).user_id;
			}
			if (!user_id) return;

			const secret = new TextEncoder().encode(JWT_SECRET);
			const refresh_token = await new SignJWT({ user_id })
				.setProtectedHeader({ alg: 'HS256' })
				.setIssuedAt()
				.sign(secret);

			return refresh_token;
		},
		async get(token) {
			const [ret_token] = await db
				.select()
				.from(refresh_tokens)
				.where(eq(refresh_tokens.refresh_token, token))
				.execute();
			return null_to_undefined(ret_token);
		},
		async store(token, token_data) {
			await db
				.insert(refresh_tokens)
				.values({ ...token_data, refresh_token: token })
				.execute();
		},
		async delete(token) {
			await db.delete(refresh_tokens).where(eq(refresh_tokens.refresh_token, token)).execute();
		}
	}
}).build(REDIRECT_BASE_URL, {
	bearer: {
		paths: {
			POST: ['/mcp'],
			GET: ['/sse']
		}
	},
	cors: {
		origin: '*',
		credentials: true
	},
	registration: true
});

export const http_transport = new HttpTransport(mcp_server, {
	oauth: auth_provider
});

export const sse_transport = new SseTransport(mcp_server, {
	oauth: auth_provider
});
