import { writable } from 'svelte/store';

// Here be the state of the app.

export const dbUser = writable<UserInterface | undefined>();

export const assistants = writable<{ [key: string]: AssistantInterface }>({});
export const conversations = writable<{ [key: string]: ConversationInterface }>({});

export const providers = writable<{ [key: string]: ProviderInterface }>({});
export const models = writable<{ [key: string]: ModelInterface }>({});
export const apiKeys = writable<{ [key: string]: ApiKeyInterface }>({});
export const hiddenItems = writable<Set<string>>(new Set());