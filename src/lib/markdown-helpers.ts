export interface MarkdownHelperOptions {
	tabIndentSize: number;
}

export const defaultOptions: MarkdownHelperOptions = {
	tabIndentSize: 2
};

export function handleTabIndentation(
	textarea: HTMLTextAreaElement,
	event: KeyboardEvent,
	options: MarkdownHelperOptions = defaultOptions
): boolean {
	if (event.key !== 'Tab') return false;

	event.preventDefault();

	const { selectionStart, selectionEnd, value } = textarea;
	
	// Find the start of the current line
	const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
	const currentLine = value.substring(lineStart, value.indexOf('\n', selectionStart));
	
	// Check if we're in a list context (starts with -, *, +, or numbered list)
	const listRegex = /^(\s*)([-*+]|\d+\.)\s/;
	const checkboxRegex = /^(\s*)([-*+])\s*\[([ x])\]\s/;
	const match = currentLine.match(listRegex) || currentLine.match(checkboxRegex);
	
	if (!match) return false;

	const indentString = ' '.repeat(options.tabIndentSize);
	
	if (event.shiftKey) {
		// Shift+Tab: Remove indentation
		const currentIndent = match[1];
		if (currentIndent.length >= options.tabIndentSize) {
			const newIndent = currentIndent.substring(options.tabIndentSize);
			const newLine = newIndent + currentLine.substring(match[1].length);
			const newValue = value.substring(0, lineStart) + newLine + value.substring(lineStart + currentLine.length);
			
			textarea.value = newValue;
			const newCursorPos = selectionStart - options.tabIndentSize;
			textarea.setSelectionRange(newCursorPos, newCursorPos);
		}
	} else {
		// Tab: Add indentation
		const newIndent = match[1] + indentString;
		const newLine = newIndent + currentLine.substring(match[1].length);
		const newValue = value.substring(0, lineStart) + newLine + value.substring(lineStart + currentLine.length);
		
		textarea.value = newValue;
		const newCursorPos = selectionStart + options.tabIndentSize;
		textarea.setSelectionRange(newCursorPos, newCursorPos);
	}
	
	return true;
}

export function handleEnterForChecklists(
	textarea: HTMLTextAreaElement,
	event: KeyboardEvent
): boolean {
	if (event.key !== 'Enter') return false;

	const { selectionStart, value } = textarea;
	
	// Find the current line
	const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
	const lineEnd = value.indexOf('\n', selectionStart);
	const currentLine = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd);
	
	// Check if we're in a checkbox list
	const checkboxRegex = /^(\s*)([-*+])\s*\[([ x])\]\s*(.*)/;
	const match = currentLine.match(checkboxRegex);
	
	if (!match) {
		// Check for regular list items and continue them
		const listRegex = /^(\s*)([-*+]|\d+\.)\s+(.*)/;
		const listMatch = currentLine.match(listRegex);
		
		if (listMatch) {
			const [, indent, marker, content] = listMatch;
			
			// If the line is empty (just the marker), remove it
			if (!content.trim()) {
				event.preventDefault();
				const newValue = value.substring(0, lineStart) + indent + value.substring(lineEnd === -1 ? value.length : lineEnd);
				textarea.value = newValue;
				textarea.setSelectionRange(lineStart + indent.length, lineStart + indent.length);
				return true;
			}
			
			// Continue the list
			event.preventDefault();
			let newMarker = marker;
			
			// Handle numbered lists
			if (/^\d+\.$/.test(marker)) {
				const num = parseInt(marker);
				newMarker = `${num + 1}.`;
			}
			
			const newListItem = `\n${indent}${newMarker} `;
			const newValue = value.substring(0, selectionStart) + newListItem + value.substring(selectionStart);
			
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
		const newValue = value.substring(0, lineStart) + indent + value.substring(lineEnd === -1 ? value.length : lineEnd);
		textarea.value = newValue;
		textarea.setSelectionRange(lineStart + indent.length, lineStart + indent.length);
		return true;
	}
	
	// Create a new checkbox item
	event.preventDefault();
	const newCheckbox = `\n${indent}${marker} [ ] `;
	const newValue = value.substring(0, selectionStart) + newCheckbox + value.substring(selectionStart);
	
	textarea.value = newValue;
	const newCursorPos = selectionStart + newCheckbox.length;
	textarea.setSelectionRange(newCursorPos, newCursorPos);
	
	return true;
}

export function setupMarkdownHelpers(
	textarea: HTMLTextAreaElement,
	options: MarkdownHelperOptions = defaultOptions
): () => void {
	function handleKeyDown(event: KeyboardEvent) {
		if (handleTabIndentation(textarea, event, options)) {
			textarea.dispatchEvent(new Event('input', { bubbles: true }));
			return;
		}
		
		if (handleEnterForChecklists(textarea, event)) {
			textarea.dispatchEvent(new Event('input', { bubbles: true }));
			return;
		}
	}
	
	textarea.addEventListener('keydown', handleKeyDown);
	
	// Return cleanup function
	return () => {
		textarea.removeEventListener('keydown', handleKeyDown);
	};
}