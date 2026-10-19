<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { browser } from '$app/environment';
	import { ClerkProvider, UserButton } from 'svelte-clerk';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();

	// Tell the server the walker's zone once; loads then render in it, so the
	// times the browser hydrates match what was served.
	$effect(() => {
		if (!browser) return;
		const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		if (!zone || zone === data.tz) return;
		document.cookie = `tz=${encodeURIComponent(zone)}; path=/; max-age=31536000; SameSite=Lax`;
		invalidateAll();
	});

	const nav = [
		{ href: '/', label: 'Today' },
		{ href: '/walks', label: 'Walks' },
		{ href: '/clients', label: 'Clients' }
	];
	const current = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	// SSR auth state from buildClerkProps; the provider reads it at runtime but
	// its typed props omit it, so it goes in by spread.
	const clerkProps = $derived(
		('initialState' in data ? { initialState: data.initialState } : {}) as Record<string, unknown>
	);
</script>

{#snippet shell()}
	<header class="topbar">
		<a class="brand" href="/">🐾 Dog Walking</a>
		{#if data.signedIn}
			<nav aria-label="Primary">
				{#each nav as item (item.href)}
					<a href={item.href} aria-current={current(item.href) ? 'page' : undefined}>{item.label}</a>
				{/each}
			</nav>
			<div class="user">
				{#if data.devBearer}
					<span class="pill" title="API_DEV_BEARER is set">dev</span>
				{:else}
					<UserButton />
				{/if}
			</div>
		{/if}
	</header>
	<main>
		{@render children()}
	</main>
{/snippet}

{#if data.devBearer}
	{@render shell()}
{:else}
	<ClerkProvider {...clerkProps}>
		{@render shell()}
	</ClerkProvider>
{/if}
