import { buildClerkProps } from 'svelte-clerk/server';
import { env } from '$env/dynamic/private';
import { readTimeZone } from '$lib/api';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, cookies }) => {
	const devBearer = Boolean(env.API_DEV_BEARER);
	return {
		devBearer,
		// The walker's IANA zone (from the `tz` cookie the browser sets), so the
		// server and the browser render every time and day the same way.
		tz: readTimeZone(cookies),
		signedIn: Boolean(locals.auth().userId),
		...(devBearer ? {} : buildClerkProps(locals.auth()))
	};
};
