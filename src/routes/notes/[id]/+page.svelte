<script lang="ts">
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { get_notes } from '$lib/contexts/notes-contexts.js';
	import { setup_markdown_helpers } from '$lib/markdown-helpers.js';

	let { data } = $props();
	let note_content = $derived(data.selected_note.content);
	let note_title = $derived(data.selected_note.title);
	let is_saving = $state(false);
	let last_saved = $derived(
		data.selected_note.updated_at ? new Date(data.selected_note.updated_at) : null
	);

	const override = $derived(get_notes()(data.selected_note.id));

	// Auto-save functionality
	let save_timeout: ReturnType<typeof setTimeout>;
	function schedule_auto_save() {
		clearTimeout(save_timeout);
		save_timeout = setTimeout(save_note, 2000);
	}

	// Update content and schedule save
	function update_content(new_content: string) {
		note_content = new_content;
		schedule_auto_save();
	}

	function update_title(new_title: string) {
		note_title = new_title;
		schedule_auto_save();
	}

	// Save note function
	async function save_note() {
		is_saving = true;
		try {
			const new_note = { title: note_title, content: note_content };
			const response = await fetch(`/api/notes/${data.selected_note.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(new_note)
			});

			if (response.ok) {
				override(new_note);
				last_saved = new Date();
			}
		} catch (error) {
			console.error('Failed to save note:', error);
		} finally {
			is_saving = false;
		}
	}

	// Markdown helpers setup
	let textarea_element: HTMLTextAreaElement;
	let cleanup_markdown_helpers: (() => void) | null = null;

	function setup_textarea(element: HTMLTextAreaElement) {
		textarea_element = element;
		if (browser) {
			cleanup_markdown_helpers = setup_markdown_helpers(element);
		}
		return {
			destroy() {
				cleanup_markdown_helpers?.();
			}
		};
	}
</script>

<svelte:head>
	<title>Squiggles Notes - {data.selected_note.title}</title>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<form use:enhance method="POST" action="?/save" class="flex flex-1 flex-col">
	<!-- Editor Header -->
	<div class="border-b border-orange-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
		<input
			bind:value={note_title}
			name="title"
			oninput={(e) => update_title(e.currentTarget.value)}
			class="w-full border-none bg-transparent text-2xl font-bold text-orange-900 placeholder-orange-400 outline-none dark:text-gray-100 dark:placeholder-gray-500"
			placeholder="Note title"
		/>
		<div class="mt-2 flex items-center justify-between">
			<div class="flex items-center gap-4 text-sm text-orange-600 dark:text-gray-300">
				{#if last_saved}
					<span>✓ Saved at {last_saved.toLocaleTimeString()}</span>
				{:else if browser}
					<span>✨ Auto-save enabled</span>
				{/if}
			</div>
			<button
				onclick={(e) => {
					e.preventDefault();
					save_note();
				}}
				class="rounded bg-orange-500 px-4 py-1 text-sm font-medium text-white transition-colors hover:bg-orange-600 focus:ring-2 focus:ring-orange-400 focus:outline-none disabled:opacity-50 dark:bg-orange-600 dark:hover:bg-orange-700"
				disabled={is_saving}
			>
				Save
			</button>
		</div>
	</div>

	<!-- Editor Content -->
	<div class="flex-1 bg-white p-4 dark:bg-gray-900">
		<textarea
			name="content"
			bind:value={note_content}
			use:setup_textarea
			oninput={(e) => update_content(e.currentTarget.value)}
			class="h-full w-full resize-none border-none font-mono text-orange-900 placeholder-orange-400 outline-none dark:bg-gray-900 dark:text-gray-100 dark:placeholder-gray-500"
			placeholder="Start writing your note in markdown...\n\n# Heading 1\n## Heading 2\n\n- List item\n  - Nested item (use Tab to indent)\n- Another item\n- [ ] Checklist item (press Enter for next)\n- [x] Completed item\n\n**Bold text** and *italic text*\n\n```\nCode block\n```"
		></textarea>
	</div>
</form>
