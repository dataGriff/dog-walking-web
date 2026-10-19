<script lang="ts">
	import { enhance } from '$app/forms';
	import { CANCELLATION_REASONS, formatDateTime, isoToZonedLocal } from '$lib/api';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();
	let editing = $state(false);
	const walk = $derived(data.walk);
	const dogNames = $derived(Object.fromEntries(data.dogs.map((d) => [d.dog_id, d.name])));
	const open = $derived(walk.status === 'scheduled' || walk.status === 'in_progress');
	const failedForm = $derived((form?.values as { form?: string } | undefined)?.form);
	const reasonLabel = $derived(CANCELLATION_REASONS.find((r) => r.value === walk.cancellation_reason)?.label);
</script>

<svelte:head><title>Walk · Dog Walking</title></svelte:head>

<p><a href="/walks">← Walks</a></p>
<div class="row between">
	<h1>{formatDateTime(walk.scheduled_at, undefined, data.tz)}</h1>
	<span class="status {walk.status}">{walk.status.replace('_', ' ')}</span>
</div>
{#if form?.updated}<p class="meta">Saved.</p>{/if}
{#if form?.message}<p class="problem">{form.message}</p>{/if}

<section class="card">
	<div>{walk.duration_minutes} minutes with {walk.dog_ids.map((id) => dogNames[id] ?? 'an unknown dog').join(', ')}</div>
	{#if walk.notes}<p>{walk.notes}</p>{/if}
	<div class="meta">
		{#if walk.started_at}Started {formatDateTime(walk.started_at, undefined, data.tz)}.{/if}
		{#if walk.completed_at}Completed {formatDateTime(walk.completed_at, undefined, data.tz)}.{/if}
		{#if walk.cancelled_at}Cancelled {formatDateTime(walk.cancelled_at, undefined, data.tz)}{#if reasonLabel}: {reasonLabel}{/if}.{/if}
	</div>
	{#if open}
		<div class="actions">
			{#if walk.status === 'scheduled'}
				<form class="inline-form" method="POST" action="?/start" use:enhance><button>Start walk</button></form>
				<button class="secondary" onclick={() => (editing = !editing)}>{editing ? 'Close' : 'Reschedule'}</button>
			{/if}
		</div>
	{/if}
</section>

{#if open && walk.status === 'scheduled' && (editing || failedForm === 'update')}
	<section class="card">
		<h3>Reschedule</h3>
		<form class="stack" method="POST" action="?/update" use:enhance>
			<label>When <input type="datetime-local" name="scheduled_at" value={isoToZonedLocal(walk.scheduled_at, data.tz)} /></label>
			<label>Duration (minutes) <input type="number" name="duration_minutes" min="1" value={walk.duration_minutes} /></label>
			<fieldset>
				<legend>Dogs</legend>
				{#each data.dogs as dog (dog.dog_id)}
					<label><input type="checkbox" name="dog_ids" value={dog.dog_id} checked={walk.dog_ids.includes(dog.dog_id)} /> {dog.name}</label>
				{/each}
			</fieldset>
			<label>Notes <textarea name="notes">{walk.notes ?? ''}</textarea></label>
			<div class="actions"><button>Save</button></div>
		</form>
	</section>
{/if}

{#if open}
	<section class="card">
		<h3>Complete</h3>
		<form class="stack" method="POST" action="?/complete" use:enhance>
			<label>How did it go? <textarea name="notes" placeholder="Optional notes"></textarea></label>
			<div class="actions"><button>Mark completed</button></div>
		</form>
	</section>

	<section class="card" id="cancel">
		<h3>Cancel</h3>
		<form class="stack" method="POST" action="?/cancel" use:enhance>
			<label>Reason
				<select name="reason" required>
					<option value="">Choose…</option>
					{#each CANCELLATION_REASONS as r (r.value)}<option value={r.value}>{r.label}</option>{/each}
				</select>
			</label>
			<div class="actions"><button class="danger">Cancel walk</button></div>
		</form>
	</section>
{/if}
