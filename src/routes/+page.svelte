<script lang="ts">
	import WalkCard from '$lib/components/WalkCard.svelte';
	import { formatDay, groupByDay, todayKey } from '$lib/api';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const today = todayKey();
	const days = $derived(groupByDay(data.walks));
</script>

<svelte:head><title>Today · Dog Walking</title></svelte:head>

<div class="row between">
	<h1>This week</h1>
	<a class="button" href="/walks/new">Schedule a walk</a>
</div>

{#if data.dogCount === 0}
	<p class="empty">
		No dogs yet. <a href="/clients">Add a client and their dogs</a> to start scheduling walks.
	</p>
{:else if days.length === 0}
	<p class="empty">Nothing open in the next seven days.</p>
{/if}

{#each days as group (group.day)}
	<div class="day">{group.day === today ? 'Today' : formatDay(group.day)}</div>
	{#each group.items as walk (walk.walk_id)}
		<WalkCard {walk} dogNames={data.dogNames} />
	{/each}
{/each}
