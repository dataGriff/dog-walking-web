import { error, fail } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createClientsApi, createWalksApi, describeProblem } from '$lib/api';

/**
 * Per-request API access. The token is the walker's Clerk session token,
 * or the literal `API_DEV_BEARER` when developing against an API in test
 * auth mode. `fetch` is SvelteKit's, so server-side calls are traced and
 * relative URLs would resolve.
 */
export async function api(event: RequestEvent) {
	const baseUrl = env.API_BASE_URL;
	if (!baseUrl) error(500, 'API_BASE_URL is not configured');
	// Truthiness, as in hooks.server.ts: an empty API_DEV_BEARER means off.
	const token = env.API_DEV_BEARER || (await event.locals.auth().getToken());
	if (!token) error(401, 'No session');
	return {
		clients: createClientsApi(baseUrl, token, event.fetch),
		walks: createWalksApi(baseUrl, token, event.fetch)
	};
}

/** Throw a SvelteKit error for a failed load, with the contract's message. */
export function loadError(status: number, body: unknown): never {
	error(status, describeProblem(body, status));
}

/** Return a form `fail()` carrying the contract's message and the submitted values. */
export function actionFail(status: number, body: unknown, values: Record<string, unknown> = {}) {
	return fail(status >= 400 && status < 600 ? status : 500, {
		message: describeProblem(body, status),
		values
	});
}

export function str(data: FormData, key: string): string | undefined {
	const v = data.get(key);
	if (typeof v !== 'string') return undefined;
	const trimmed = v.trim();
	return trimmed === '' ? undefined : trimmed;
}

/** A field for a PATCH body: undefined when the form did not send it (left
 * unchanged), "" when it was emptied (the API clears it), else trimmed. */
export function patchField(data: FormData, key: string): string | undefined {
	const v = data.get(key);
	return typeof v === 'string' ? v.trim() : undefined;
}
