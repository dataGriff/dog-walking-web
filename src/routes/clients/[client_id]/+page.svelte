<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let editing = $state(false);
	const v = $derived((form?.values ?? {}) as Record<string, string | undefined>);
	const failedForm = $derived(v.form);
</script>

<svelte:head><title>{data.client.name} · Dog Walking</title></svelte:head>

<p><a href="/clients">← Clients</a></p>
<div class="row between">
	<h1>{data.client.name}</h1>
	<button class="secondary" onclick={() => (editing = !editing)}>{editing ? 'Close' : 'Edit'}</button>
</div>

{#if form?.updated}<p class="meta">Saved.</p>{/if}
{#if form?.message && failedForm !== 'addDog'}<p class="problem">{form.message}</p>{/if}

{#if editing || failedForm === 'update'}
	<section class="card">
		<form class="stack" method="POST" action="?/update" use:enhance>
			<label>Name <input name="name" required value={v.name ?? data.client.name} /></label>
			<label>Email <input name="email" type="email" value={v.email ?? data.client.email ?? ''} /></label>
			<label>Phone <input name="phone" type="tel" value={v.phone ?? data.client.phone ?? ''} /></label>
			<label>Address <input name="address" value={v.address ?? data.client.address ?? ''} /></label>
			<label>Notes <textarea name="notes">{v.notes ?? data.client.notes ?? ''}</textarea></label>
			<div class="actions"><button>Save</button></div>
		</form>
	</section>
{:else}
	<section class="card">
		{#if data.client.email}<div><a href="mailto:{data.client.email}">{data.client.email}</a></div>{/if}
		{#if data.client.phone}<div><a href="tel:{data.client.phone}">{data.client.phone}</a></div>{/if}
		{#if data.client.address}<div class="meta">{data.client.address}</div>{/if}
		{#if data.client.notes}<p>{data.client.notes}</p>{/if}
	</section>
{/if}

<h2>Dogs</h2>
{#if data.dogs.length === 0}<p class="empty">No dogs yet.</p>{/if}
{#each data.dogs as dog (dog.dog_id)}
	<article class="card">
		<h3><a href="/dogs/{dog.dog_id}">{dog.name}</a></h3>
		<div class="meta">
			{dog.breed ?? 'Breed not recorded'}{#if dog.date_of_birth} · born {dog.date_of_birth}{/if}
		</div>
		{#if dog.notes}<p>{dog.notes}</p>{/if}
	</article>
{/each}

<section class="card">
	<h3>Add a dog</h3>
	{#if form?.dogAdded}<p class="meta">{form.dogAdded} added.</p>{/if}
	{#if form?.message && failedForm === 'addDog'}<p class="problem">{form.message}</p>{/if}
	<form class="stack" method="POST" action="?/addDog" use:enhance>
		<label>Name <input name="name" required value={failedForm === 'addDog' ? (v.name ?? '') : ''} /></label>
		<label>Breed <input name="breed" value={failedForm === 'addDog' ? (v.breed ?? '') : ''} /></label>
		<label>Date of birth <input name="date_of_birth" type="date" value={failedForm === 'addDog' ? (v.date_of_birth ?? '') : ''} /></label>
		<label>Notes <textarea name="notes">{failedForm === 'addDog' ? (v.notes ?? '') : ''}</textarea></label>
		<div class="actions"><button>Add dog</button></div>
	</form>
</section>

<h2>Remove</h2>
<form method="POST" action="?/delete" use:enhance onsubmit={(e) => { if (!confirm(`Remove ${data.client.name} and all their dogs?`)) e.preventDefault(); }}>
	<button class="danger">Remove client and their dogs</button>
</form>
