<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	const v = $derived((form?.values ?? {}) as { scheduled_at?: string; duration_minutes?: string; dog_ids?: string[]; notes?: string });
	const chosen = $derived(new Set(v.dog_ids ?? data.preselect));
</script>

<svelte:head><title>Schedule a walk · Dog Walking</title></svelte:head>

<p><a href="/walks">← Walks</a></p>
<h1>Schedule a walk</h1>
{#if form?.message}<p class="problem">{form.message}</p>{/if}

{#if data.dogs.length === 0}
	<p class="empty">You need a dog before you can schedule a walk. <a href="/clients">Add one from a client.</a></p>
{:else}
	<form class="stack card" method="POST" use:enhance>
		<label>When <input type="datetime-local" name="scheduled_at" required value={v.scheduled_at ?? ''} /></label>
		<label>Duration (minutes) <input type="number" name="duration_minutes" min="1" required value={v.duration_minutes ?? '45'} /></label>
		<fieldset>
			<legend>Dogs</legend>
			{#each data.dogs as dog (dog.dog_id)}
				<label><input type="checkbox" name="dog_ids" value={dog.dog_id} checked={chosen.has(dog.dog_id)} /> {dog.name}{#if dog.owner} <span class="meta">({dog.owner})</span>{/if}</label>
			{/each}
		</fieldset>
		<label>Notes <textarea name="notes">{v.notes ?? ''}</textarea></label>
		<div class="actions"><button>Schedule</button></div>
	</form>
{/if}
