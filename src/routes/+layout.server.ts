import { buildClerkProps } from 'svelte-clerk/server';
import { env } from '$env/dynamic/private';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	const devBearer = Boolean(env.API_DEV_BEARER);
	return {
		devBearer,
		signedIn: Boolean(locals.auth().userId),
		...(devBearer ? {} : buildClerkProps(locals.auth()))
	};
};
