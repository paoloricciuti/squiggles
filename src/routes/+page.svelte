<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="relative flex min-h-screen items-center justify-center bg-orange-50 dark:bg-gray-900">
	<div class="w-full max-w-md rounded-lg bg-white p-8 shadow-md dark:bg-gray-800">
		<div class="mb-8 grid gap-8 text-center">
			<h1 class="text-4xl font-bold text-orange-900 dark:text-gray-100">Squiggles Notes</h1>
			<div class="text-6xl">📝</div>
			<p class="text-orange-600 dark:text-gray-300">
				A delightfully simple markdown note-taking app
			</p>
		</div>

		<a
			href="/auth/github{page.url.search}"
			class="flex w-full items-center justify-center gap-3 rounded-lg bg-orange-500 px-4 py-3 font-medium text-white transition-colors hover:bg-orange-600 focus:ring-2 focus:ring-orange-400 focus:outline-none dark:bg-orange-600 dark:hover:bg-orange-700"
		>
			<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
				<path
					fill-rule="evenodd"
					d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
					clip-rule="evenodd"
				/>
			</svg>
			Sign in with GitHub
		</a>
	</div>
</div>
