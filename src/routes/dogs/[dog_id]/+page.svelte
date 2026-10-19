<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const v = $derived((form?.values ?? {}) as Record<string, string | undefined>);
</script>

<svelte:head><title>{data.dog.name} · Dog Walking</title></svelte:head>

<p>
	{#if data.owner}<a href="/clients/{data.owner.client_id}">← {data.owner.name}</a>{:else}<a href="/clients">← Clients</a>{/if}
</p>
<h1>{data.dog.name}</h1>
{#if form?.updated}<p class="meta">Saved.</p>{/if}
{#if form?.message}<p class="problem">{form.message}</p>{/if}

<section class="card">
	<form class="stack" method="POST" action="?/update" use:enhance>
		<label>Name <input name="name" required value={v.name ?? data.dog.name} /></label>
		<label>Breed <input name="breed" value={v.breed ?? data.dog.breed ?? ''} /></label>
		<label>Date of birth <input name="date_of_birth" type="date" value={v.date_of_birth ?? data.dog.date_of_birth ?? ''} /></label>
		<label>Notes <textarea name="notes">{v.notes ?? data.dog.notes ?? ''}</textarea></label>
		<div class="actions"><button>Save</button></div>
	</form>
</section>

<h2>Remove</h2>
<form method="POST" action="?/delete" use:enhance={({ cancel }) => { if (!confirm(`Remove ${data.dog.name}?`)) cancel(); }}>
	<button class="danger">Remove dog</button>
</form>
