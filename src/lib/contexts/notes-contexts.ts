import type { Note } from '$lib/server/db/schema';
import { getContext, setContext } from 'svelte';

const NOTES_CONTEXT_KEY = Symbol('notes-context');

type NotesContext = (id: number) => (override: Partial<Note>) => void;

export function set_notes_override(notes: NotesContext) {
	setContext<NotesContext>(NOTES_CONTEXT_KEY, notes);
}

export function get_notes() {
	return getContext<NotesContext>(NOTES_CONTEXT_KEY);
}
