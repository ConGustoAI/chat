import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { ClassValue } from 'tailwind-variants';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function capitalize(str: string) {
	return str[0].toUpperCase() + str.slice(1);
}

export function getIncrementedName(baseName: string, existingNames: string[]): string {
	let counter = 1;
	let name = `${baseName}${counter.toString().padStart(2, '0')}`;
	while (existingNames.includes(name)) {
		counter++;
		name = `${baseName}${counter.toString().padStart(2, '0')}`;
	}
	return name;
}

export async function fetchAssistants() {
	const res = await fetch('/api/assistants');
	if (!res.ok) throw new Error('Failed to fetch assistants');
	const data = await res.json();

	const assistantsDict: Record<string, AssistantInterface> = {};

	for (const assistant of data) {
		assistantsDict[assistant.id] = assistant;
	}
	return assistantsDict;
}

export async function fetchHistory() {
	const res = await fetch('/api/history');
	if (!res.ok) throw new Error('Failed to fetch conversations');
	const data = await res.json();

	const historyDict: Record<string, ConversationInterface> = {};

	for (const conversation of data) {
		historyDict[conversation.id] = conversation;
	}
	return historyDict;
}

export async function fetchConversation(id: string) {
	const res = await fetch(`/api/conversation/${id}`);
	if (!res.ok) throw new Error('Failed to fetch conversation');
	const data = await res.json();

	return data;
}
