<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let adding = $state(false);
	const v = $derived((form?.values ?? {}) as Record<string, string | undefined>);
</script>

<svelte:head><title>Clients · Dog Walking</title></svelte:head>

<div class="row between">
	<h1>Clients</h1>
	<button class="secondary" onclick={() => (adding = !adding)}>{adding ? 'Close' : 'Add a client'}</button>
</div>

{#if adding || form?.message}
	<section class="card">
		<h3>New client</h3>
		{#if form?.message}<p class="problem">{form.message}</p>{/if}
		<form class="stack" method="POST" action="?/create" use:enhance>
			<label>Name <input name="name" required value={v.name ?? ''} /></label>
			<label>Email <input name="email" type="email" value={v.email ?? ''} /></label>
			<label>Phone <input name="phone" type="tel" value={v.phone ?? ''} /></label>
			<label>Address <input name="address" value={v.address ?? ''} /></label>
			<label>Notes <textarea name="notes">{v.notes ?? ''}</textarea></label>
			<div class="actions"><button>Add client</button></div>
		</form>
	</section>
{/if}

{#if data.clients.length === 0}
	<p class="empty">No clients yet.</p>
{/if}
{#each data.clients as client (client.client_id)}
	<article class="card">
		<h3><a href="/clients/{client.client_id}">{client.name}</a></h3>
		<div class="meta">
			{#if client.dogs.length}{client.dogs.join(', ')}{:else}No dogs yet{/if}
			{#if client.phone} · {client.phone}{/if}
		</div>
	</article>
{/each}
