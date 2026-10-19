<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { formatTime, type Walk } from '$lib/api';

	let { walk, dogNames = {}, tz }: { walk: Walk; dogNames?: Record<string, string>; tz: string } = $props();

	const dogs = $derived(walk.dog_ids.map((id) => dogNames[id] ?? 'Unknown dog').join(', '));
	const back = $derived(encodeURIComponent(page.url.pathname + page.url.search));
</script>

<article class="card">
	<div class="row between">
		<h3><a href="/walks/{walk.walk_id}">{formatTime(walk.scheduled_at, undefined, tz)} · {dogs}</a></h3>
		<span class="status {walk.status}">{walk.status.replace('_', ' ')}</span>
	</div>
	<div class="meta">
		{walk.duration_minutes} min{#if walk.notes} · {walk.notes}{/if}
	</div>
	{#if walk.status === 'scheduled' || walk.status === 'in_progress'}
		<div class="actions">
			{#if walk.status === 'scheduled'}
				<form class="inline-form" method="POST" action="/walks/{walk.walk_id}?/start&redirect_to={back}" use:enhance>
					<button>Start</button>
				</form>
			{/if}
			<form class="inline-form" method="POST" action="/walks/{walk.walk_id}?/complete&redirect_to={back}" use:enhance>
				<button class={walk.status === 'in_progress' ? '' : 'secondary'}>Complete</button>
			</form>
			<a class="button secondary" href="/walks/{walk.walk_id}#cancel">Cancel…</a>
		</div>
	{/if}
</article>
