<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, children, params } = $props();

	let checked = $state(false);
</script>

<div
	class="grid h-screen bg-orange-50 not-sm:grid-cols-1 not-sm:*:col-span-full not-sm:*:row-start-1 not-sm:*:row-end-1 sm:grid-cols-[auto_1fr] dark:bg-gray-900"
>
	<label
		class="fixed bottom-6 left-6 z-20 aspect-square w-10 rounded-full bg-orange-500 before:absolute before:top-1/3 before:left-1/2 before:h-[3px] before:w-1/2 before:-translate-x-1/2 before:bg-orange-100 after:absolute after:bottom-1/3 after:left-1/2 after:h-[3px] after:w-1/2 after:-translate-x-1/2 after:bg-orange-100 sm:hidden"
	>
		<input id="menu-toggler" bind:checked type="checkbox" class="hidden" />
	</label>
	<!-- Sidebar -->
	<div
		class="test z-10 flex w-full flex-col border-r border-orange-200 bg-white not-sm:transform not-sm:transition-transform md:w-80 dark:border-gray-700 dark:bg-gray-800 not-sm:[:not(:has(:checked))_+_&]:-translate-x-full"
	>
		<!-- Header -->
		<div class="border-b border-orange-200 p-4 dark:border-gray-700">
			<div class="mb-4 flex items-center justify-between">
				<h1 class="text-xl font-semibold text-orange-900 dark:text-gray-100">Squiggles Notes</h1>
				<div class="flex items-center gap-2">
					<form class="logout" action="/auth/logout" method="POST">
						<button
							aria-label="Logout"
							class="text-sm font-medium text-orange-600 hover:text-orange-900 dark:text-gray-300 dark:hover:text-gray-100"
							><svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
								><path
									fill="currentColor"
									d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h7v2H5v14h7v2zm11-4l-1.375-1.45l2.55-2.55H9v-2h8.175l-2.55-2.55L16 7l5 5z"
								/></svg
							></button
						>
					</form>
					<img src={data.user.avatar_url} alt={data.user.username} class="h-8 w-8 rounded-full" />
				</div>
			</div>
			<form action="/notes?/create" method="POST" use:enhance>
				<button
					onclick={() => {
						checked = false;
					}}
					class="w-full rounded-lg bg-orange-500 px-4 py-2 font-medium text-white transition-colors hover:bg-orange-600 focus:ring-2 focus:ring-orange-400 focus:outline-none dark:bg-orange-600 dark:hover:bg-orange-700"
				>
					+ New Note
				</button>
			</form>
		</div>

		<!-- Notes List -->
		<ul class="flex-1 overflow-y-auto">
			{#each data.notes as note (note.id)}
				<li
					class="block border-b border-orange-100 p-4 transition-colors hover:bg-orange-50 focus:bg-orange-100 focus:outline-none dark:border-gray-700 dark:hover:bg-gray-700 dark:focus:bg-gray-600 {params.id ===
					note.id.toString()
						? 'border-orange-300 bg-orange-100 dark:border-orange-500 dark:bg-gray-600'
						: ''}"
				>
					<div class="mb-1 flex items-start justify-between">
						<h3 class="truncate font-medium text-orange-900 dark:text-gray-100">
							<a
								onclick={() => {
									checked = false;
								}}
								href="/notes/{note.id}">{note.title}</a
							>
						</h3>
						<form use:enhance action="/notes?/delete" method="POST">
							{#if params.id === note.id.toString()}
								<input type="hidden" name="current" />
							{/if}
							<button
								name="id"
								value={note.id}
								class="ml-2 text-lg font-bold text-orange-400 hover:text-red-600 focus:text-red-600 focus:outline-none dark:text-gray-400 dark:hover:text-red-400"
								aria-label="Delete note"
							>
								×
							</button>
						</form>
					</div>
					<p class="line-clamp-2 text-sm text-orange-700 dark:text-gray-300">
						{note.content.slice(0, 100)}...
					</p>
					<p class="mt-2 text-xs text-orange-500 dark:text-gray-400">
						{new Date(note.updated_at).toLocaleDateString()}
					</p>
				</li>
			{:else}
				<li class="text-center dark:text-gray-400 text-2xl mt-8">No notes...yet 😈</li>
			{/each}
		</ul>
	</div>
	{@render children()}
</div>

<style>
	.logout {
		line-height: 0;
	}
</style>
