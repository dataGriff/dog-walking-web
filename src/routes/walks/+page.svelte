<script lang="ts">
	import WalkCard from '$lib/components/WalkCard.svelte';
	import { WALK_STATUSES, formatDay, groupByDay, shiftDay } from '$lib/api';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const days = $derived(groupByDay(data.walks));
	const link = (week: string) => `/walks?week=${week}${data.status ? `&status=${data.status}` : ''}`;
</script>

<svelte:head><title>Walks · Dog Walking</title></svelte:head>

<div class="row between">
	<h1>Walks</h1>
	<a class="button" href="/walks/new">Schedule a walk</a>
</div>

<form class="filters" method="GET" data-sveltekit-reload>
	<label>Week of <input type="date" name="week" value={data.weekStart} /></label>
	<label>Status
		<select name="status">
			<option value="">Any</option>
			{#each WALK_STATUSES as s (s)}<option value={s} selected={s === data.status}>{s.replace('_', ' ')}</option>{/each}
		</select>
	</label>
	<button class="secondary">Show</button>
</form>
<div class="row between">
	<a href={link(shiftDay(data.weekStart, -7))}>← Previous week</a>
	<a href={link(shiftDay(data.weekStart, 7))}>Next week →</a>
</div>

{#if days.length === 0}<p class="empty">No walks match.</p>{/if}
{#each days as group (group.day)}
	<div class="day">{formatDay(group.day)}</div>
	{#each group.items as walk (walk.walk_id)}
		<WalkCard {walk} dogNames={data.dogNames} />
	{/each}
{/each}
