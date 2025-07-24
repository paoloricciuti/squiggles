export interface MarkdownHelperOptions {
	tab_indent_size: number;
}

export const default_options: MarkdownHelperOptions = {
	tab_indent_size: 2
};

export function handle_tab_indentation(
	textarea: HTMLTextAreaElement,
	event: KeyboardEvent,
	options: MarkdownHelperOptions = default_options
): boolean {
	if (event.key !== 'Tab') return false;

	event.preventDefault();

	const { selectionStart: selection_start, selectionEnd: selection_end, value } = textarea;
	
	// Find the start of the current line
	const line_start = value.lastIndexOf('\n', selection_start - 1) + 1;
	const current_line = value.substring(line_start, value.indexOf('\n', selection_start));
	
	// Check if we're in a list context (starts with -, *, +, or numbered list)
	const list_regex = /^(\s*)([-*+]|\d+\.)\s/;
	const checkbox_regex = /^(\s*)([-*+])\s*\[([ x])\]\s/;
	const match = current_line.match(list_regex) || current_line.match(checkbox_regex);
	
	if (!match) return false;

	const indent_string = ' '.repeat(options.tab_indent_size);
	
	if (event.shiftKey) {
		// Shift+Tab: Remove indentation
		const current_indent = match[1];
		if (current_indent.length >= options.tab_indent_size) {
			const new_indent = current_indent.substring(options.tab_indent_size);
			const new_line = new_indent + current_line.substring(match[1].length);
			const new_value = value.substring(0, line_start) + new_line + value.substring(line_start + current_line.length);
			
			textarea.value = new_value;
			const new_cursor_pos = selection_start - options.tab_indent_size;
			textarea.setSelectionRange(new_cursor_pos, new_cursor_pos);
		}
	} else {
		// Tab: Add indentation
		const new_indent = match[1] + indent_string;
		const new_line = new_indent + current_line.substring(match[1].length);
		const new_value = value.substring(0, line_start) + new_line + value.substring(line_start + current_line.length);
		
		textarea.value = new_value;
		const new_cursor_pos = selection_start + options.tab_indent_size;
		textarea.setSelectionRange(new_cursor_pos, new_cursor_pos);
	}
	
	return true;
}

export function handle_enter_for_checklists(
	textarea: HTMLTextAreaElement,
	event: KeyboardEvent
): boolean {
	if (event.key !== 'Enter') return false;

	const { selectionStart: selection_start, value } = textarea;
	
	// Find the current line
	const line_start = value.lastIndexOf('\n', selection_start - 1) + 1;
	const line_end = value.indexOf('\n', selection_start);
	const current_line = value.substring(line_start, line_end === -1 ? value.length : line_end);
	
	// Check if we're in a checkbox list
	const checkbox_regex = /^(\s*)([-*+])\s*\[([ x])\]\s*(.*)/;
	const match = current_line.match(checkbox_regex);
	
	if (!match) {
		// Check for regular list items and continue them
		const list_regex = /^(\s*)([-*+]|\d+\.)\s+(.*)/;
		const list_match = current_line.match(list_regex);
		
		if (list_match) {
			const [, indent, marker, content] = list_match;
			
			// If the line is empty (just the marker), remove it
			if (!content.trim()) {
				event.preventDefault();
				const new_value = value.substring(0, line_start) + indent + value.substring(line_end === -1 ? value.length : line_end);
				textarea.value = new_value;
				textarea.setSelectionRange(line_start + indent.length, line_start + indent.length);
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
			const new_value = value.substring(0, selection_start) + new_list_item + value.substring(selection_start);
			
			textarea.value = newValue;
			const newCursorPos = selectionStart + newListItem.length;
			textarea.setSelectionRange(newCursorPos, newCursorPos);
			
			return true;
		}
		
		return false;
	}
	
	const [, indent, marker, checked, content] = match;
	
	// If the line is empty (just the checkbox), remove it
	if (!content.trim()) {
		event.preventDefault();
		const new_value = value.substring(0, line_start) + indent + value.substring(line_end === -1 ? value.length : line_end);
		textarea.value = new_value;
		textarea.setSelectionRange(line_start + indent.length, line_start + indent.length);
		return true;
	}
	
	// Create a new checkbox item
	event.preventDefault();
	const new_checkbox = `\n${indent}${marker} [ ] `;
	const new_value = value.substring(0, selection_start) + new_checkbox + value.substring(selection_start);
	
	textarea.value = new_value;
	const new_cursor_pos = selection_start + new_checkbox.length;
	textarea.setSelectionRange(new_cursor_pos, new_cursor_pos);
	
	return true;
}

export function setup_markdown_helpers(
	textarea: HTMLTextAreaElement,
	options: MarkdownHelperOptions = default_options
): () => void {
	function handle_key_down(event: KeyboardEvent) {
		if (handle_tab_indentation(textarea, event, options)) {
			textarea.dispatchEvent(new Event('input', { bubbles: true }));
			return;
		}
		
		if (handle_enter_for_checklists(textarea, event)) {
			textarea.dispatchEvent(new Event('input', { bubbles: true }));
			return;
		}
	}
	
	textarea.addEventListener('keydown', handle_key_down);
	
	// Return cleanup function
	return () => {
		textarea.removeEventListener('keydown', handle_key_down);
	};
}