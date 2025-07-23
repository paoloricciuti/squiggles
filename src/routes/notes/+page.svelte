<script lang="ts">
	import { enhance } from '$app/forms';

	let { data } = $props();
</script>

<div
	class="grid w-full place-content-center rounded-lg bg-orange-50 p-8 shadow-md dark:bg-gray-800"
>
	<div class="mb-6 text-center">
		<img
			src={data.user.avatar_url}
			alt={data.user.username}
			class="mx-auto mb-4 h-16 w-16 rounded-full"
		/>
		<h1 class="text-2xl font-bold text-orange-900 dark:text-gray-100">
			Welcome, {data.user.username}!
		</h1>
		<p class="text-orange-600 dark:text-gray-300">You don't have any notes yet.</p>
	</div>

	<form action="/notes?/create" method="POST" use:enhance>
		<button
			class="w-full rounded-lg border border-orange-500 px-4 py-3 font-medium text-orange-500 transition-colors hover:bg-orange-600 hover:text-white focus:ring-2 focus:ring-orange-400 focus:outline-none dark:border-orange-400 dark:text-orange-400 dark:hover:bg-orange-700 dark:hover:text-white"
		>
			Create your first note
		</button>
	</form>
	<form action="/auth/logout" method="POST" class="mt-6">
		<button
			class="w-full text-sm font-medium text-orange-600 hover:text-orange-800 dark:text-gray-300 dark:hover:text-gray-100"
		>
			Logout
		</button>
	</form>
</div>
