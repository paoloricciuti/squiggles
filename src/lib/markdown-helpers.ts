export interface MarkdownHelperOptions {
	tab_indent_size: number;
}

export const default_options: MarkdownHelperOptions = {
	tab_indent_size: 2
};

// Regex constants for markdown patterns
const LIST_REGEX = /^(\s*)([-*+]|\d+\.)\s/;
const LIST_WITH_CONTENT_REGEX = /^(\s*)([-*+]|\d+\.)\s+(.*)/;
const CHECKBOX_REGEX = /^(\s*)([-*+])\s*\[([ x])\]\s/;
const CHECKBOX_WITH_CONTENT_REGEX = /^(?<indent>\s*)(?<marker>[-*+])\s*\[([ x])\]\s*(?<content>.*)/;
const CHECKBOX_FOR_TOGGLE_REGEX = /^(?<indent>\s*)(?<marker>[-*+])\s*\[(?<state>[ x])\]/;

// Helper types
interface LineInfo {
	line_start: number;
	line_end: number;
	current_line: string;
}

// Helper function to get current line information
function get_current_line_info(value: string, selection_start: number): LineInfo {
	const line_start = value.lastIndexOf('\n', selection_start - 1) + 1;
	const line_end = value.indexOf('\n', selection_start);
	const actual_line_end = line_end === -1 ? value.length : line_end;
	const current_line = value.substring(line_start, actual_line_end);
	
	return {
		line_start,
		line_end: actual_line_end,
		current_line
	};
}

// Helper function to replace a line in textarea and set cursor position
function replace_line_and_set_cursor(
	textarea: HTMLTextAreaElement,
	line_info: LineInfo,
	new_line: string,
	cursor_pos: number
): void {
	const { line_start, line_end } = line_info;
	const { value } = textarea;
	
	const new_value = value.substring(0, line_start) + new_line + value.substring(line_end);
	textarea.value = new_value;
	textarea.setSelectionRange(cursor_pos, cursor_pos);
}

export function handle_tab_indentation(
	textarea: HTMLTextAreaElement,
	event: KeyboardEvent,
	options: MarkdownHelperOptions = default_options
): boolean {
	if (event.key !== 'Tab') return false;

	const { selectionStart: selection_start, value } = textarea;
	const line_info = get_current_line_info(value, selection_start);
	const { current_line } = line_info;

	// Check if we're in a list context (starts with -, *, +, or numbered list)
	const match = current_line.match(LIST_REGEX) || current_line.match(CHECKBOX_REGEX);

	if (!match) return false;
	event.preventDefault();

	const indent_string = ' '.repeat(options.tab_indent_size);

	if (event.shiftKey) {
		// Shift+Tab: Remove indentation
		const current_indent = match[1];
		if (current_indent.length >= options.tab_indent_size) {
			const new_indent = current_indent.substring(options.tab_indent_size);
			const new_line = new_indent + current_line.substring(match[1].length);
			const new_cursor_pos = Math.max(0, selection_start - options.tab_indent_size);
			
			replace_line_and_set_cursor(textarea, line_info, new_line, new_cursor_pos);
		}
	} else {
		// Tab: Add indentation
		const new_indent = match[1] + indent_string;
		const new_line = new_indent + current_line.substring(match[1].length);
		const new_cursor_pos = selection_start + options.tab_indent_size;
		
		replace_line_and_set_cursor(textarea, line_info, new_line, new_cursor_pos);
	}

	return true;
}

export function handle_enter_for_checklists(
	textarea: HTMLTextAreaElement,
	event: KeyboardEvent
): boolean {
	if (event.key !== 'Enter') return false;

	const { selectionStart: selection_start, value } = textarea;
	const line_info = get_current_line_info(value, selection_start);
	const { current_line } = line_info;

	// Check if we're in a checkbox list
	const match = current_line.match(CHECKBOX_WITH_CONTENT_REGEX);

	if (!match) {
		// Check for regular list items and continue them
		const list_match = current_line.match(LIST_WITH_CONTENT_REGEX);

		if (list_match) {
			const [, indent, marker, content] = list_match;

			// If the line is empty (just the marker), remove it
			if (!content.trim()) {
				event.preventDefault();
				const new_cursor_pos = line_info.line_start + indent.length;
				replace_line_and_set_cursor(textarea, line_info, indent, new_cursor_pos);
				return true;
			}

			// Continue the list
			event.preventDefault();
			let new_marker = marker;

			// Handle numbered lists
			if (/^\d+\.$/.test(marker)) {
				const num = parseInt(marker);
				new_marker = `${num + 1}.`;
			}

			const new_list_item = `\n${indent}${new_marker} `;
			const new_value =
				value.substring(0, selection_start) + new_list_item + value.substring(selection_start);

			textarea.value = new_value;
			const new_cursor_pos = selection_start + new_list_item.length;
			textarea.setSelectionRange(new_cursor_pos, new_cursor_pos);

			return true;
		}

		return false;
	}

	const { indent, marker, content } = match.groups ?? {};

	// If the line is empty (just the checkbox), remove it
	if (!content.trim()) {
		event.preventDefault();
		const new_cursor_pos = line_info.line_start + indent.length;
		replace_line_and_set_cursor(textarea, line_info, indent, new_cursor_pos);
		return true;
	}

	// Create a new checkbox item
	event.preventDefault();
	const new_checkbox = `\n${indent}${marker} [ ] `;
	const new_value =
		value.substring(0, selection_start) + new_checkbox + value.substring(selection_start);

	textarea.value = new_value;
	const new_cursor_pos = selection_start + new_checkbox.length;
	textarea.setSelectionRange(new_cursor_pos, new_cursor_pos);

	return true;
}

export function handle_space_for_checkbox_toggle(
	textarea: HTMLTextAreaElement,
	event: KeyboardEvent
): boolean {
	if (event.key !== ' ') return false;

	const { selectionStart: selection_start, value } = textarea;
	const line_info = get_current_line_info(value, selection_start);
	const { current_line } = line_info;

	// Find cursor position within the line
	const cursor_in_line = selection_start - line_info.line_start;

	// Check if we're in a checkbox context and find the checkbox brackets
	const match = current_line.match(CHECKBOX_FOR_TOGGLE_REGEX);

	if (!match) return false;

	const { indent, marker, state } = match.groups ?? {};
	const checkbox_start = indent.length + marker.length + 1; // +1 for space after marker
	const checkbox_end = checkbox_start + 3; // [x] or [ ]

	// Check if cursor is inside the checkbox brackets
	if (cursor_in_line < checkbox_start || cursor_in_line >= checkbox_end) return false;

	event.preventDefault();

	// Toggle the checkbox state
	const new_state = state === ' ' ? 'x' : ' ';
	const new_checkbox = `[${new_state}]`;
	const new_line = current_line.replace(/\[([ x])\]/, new_checkbox);

	// Replace the line in the textarea and keep cursor in the same position
	replace_line_and_set_cursor(textarea, line_info, new_line, selection_start);

	return true;
}

export function handle_pointer_for_checkbox_toggle(
	textarea: HTMLTextAreaElement,
	event: PointerEvent
): boolean {
	// For mobile devices, we need to handle cursor positioning differently
	// because selectionStart might not be accurate immediately after touch
	const handle_toggle = () => {
		const { selectionStart: selection_start, value } = textarea;
		const line_info = get_current_line_info(value, selection_start);
		const { current_line } = line_info;

		// Find cursor position within the line
		const cursor_in_line = selection_start - line_info.line_start;

		// Check if we're in a checkbox context and find the checkbox brackets
		const match = current_line.match(CHECKBOX_FOR_TOGGLE_REGEX);

		if (!match) return false;

		const { indent, marker, state } = match.groups ?? {};
		const checkbox_start = indent.length + marker.length + 1; // +1 for space after marker
		const checkbox_end = checkbox_start + 3; // [x] or [ ]

		// Check if cursor is inside the checkbox brackets
		if (cursor_in_line < checkbox_start || cursor_in_line >= checkbox_end) return false;

		// Toggle the checkbox state
		const new_state = state === ' ' ? 'x' : ' ';
		const new_checkbox = `[${new_state}]`;
		const new_line = current_line.replace(/\[([ x])\]/, new_checkbox);

		// Replace the line in the textarea and keep cursor in the same position
		replace_line_and_set_cursor(textarea, line_info, new_line, selection_start);

		return true;
	};

	// Check if this is a touch device (mobile)
	const is_touch = event.pointerType === 'touch';
	
	if (is_touch) {
		// On mobile, give a small delay to ensure cursor position is accurate
		setTimeout(() => {
			if (handle_toggle()) {
				// dispatch an artificial event to let the svelte handler work
				textarea.dispatchEvent(new Event('input', { bubbles: true }));
			}
		}, 10);
		return false; // Don't prevent default immediately for mobile
	} else {
		// Desktop/mouse behavior - handle immediately
		if (handle_toggle()) {
			event.preventDefault();
			return true;
		}
		return false;
	}
}

export function setup_markdown_helpers(
	textarea: HTMLTextAreaElement,
	options: MarkdownHelperOptions = default_options
): () => void {
	function handle_key_down(event: KeyboardEvent) {
		if (handle_tab_indentation(textarea, event, options)) {
			// we prevent the default so we dispatch an artificial event to let
			// the svelte handler work
			textarea.dispatchEvent(new Event('input', { bubbles: true }));
			return;
		}

		if (handle_enter_for_checklists(textarea, event)) {
			// we prevent the default so we dispatch an artificial event to let
			// the svelte handler work
			textarea.dispatchEvent(new Event('input', { bubbles: true }));
			return;
		}

		if (handle_space_for_checkbox_toggle(textarea, event)) {
			// we prevent the default so we dispatch an artificial event to let
			// the svelte handler work
			textarea.dispatchEvent(new Event('input', { bubbles: true }));
			return;
		}
	}

	function handle_pointer_up(event: PointerEvent) {
		if (handle_pointer_for_checkbox_toggle(textarea, event)) {
			// dispatch an artificial event to let the svelte handler work
			textarea.dispatchEvent(new Event('input', { bubbles: true }));
			return;
		}
	}

	textarea.addEventListener('keydown', handle_key_down);
	textarea.addEventListener('pointerup', handle_pointer_up);

	// Return cleanup function
	return () => {
		textarea.removeEventListener('keydown', handle_key_down);
		textarea.removeEventListener('pointerup', handle_pointer_up);
	};
}
