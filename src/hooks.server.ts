import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { withClerkHandler } from 'svelte-clerk/server';
import { env } from '$env/dynamic/private';

/** Routes a signed-out visitor may see. Everything else needs a session. */
const PUBLIC_ROUTES = [/^\/sign-in(\/|$)/, /^\/sign-up(\/|$)/];

const clerk: Handle = ({ event, resolve }) => {
	if (env.API_DEV_BEARER) {
		// Local development against an API in test auth mode: no Clerk at all.
		// The literal bearer is sent to the API; locals.auth() reports a fake
		// signed-in session so the pages render.
		event.locals.auth = (() => ({
			userId: env.API_DEV_BEARER!.replace(/^test:/, ''),
			sessionId: 'dev',
			getToken: async () => env.API_DEV_BEARER!
		})) as unknown as App.Locals['auth'];
		return resolve(event);
	}
	return withClerkHandler()({ event, resolve });
};

const guard: Handle = ({ event, resolve }) => {
	const isPublic = PUBLIC_ROUTES.some((re) => re.test(event.url.pathname));
	if (isPublic && env.API_DEV_BEARER) {
		// Clerk's components are not mounted in dev-bearer mode; there is
		// nothing to sign in to.
		redirect(303, '/');
	}
	if (!isPublic && !event.locals.auth().userId) {
		const next = encodeURIComponent(event.url.pathname + event.url.search);
		redirect(303, `/sign-in?redirect_url=${next}`);
	}
	return resolve(event);
};

export const handle = sequence(clerk, guard);
