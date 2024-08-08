import type { ProviderType } from '@prisma/client';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			session: Session | null | undefined;
			user: User | null | undefined;
		}
		interface PageData {
			session: Session | null;
		}

		// interface PageState {}
		// interface Platform {}
	}

	interface UserInterface {
		id: string;
		name?: string;
		email?: string;
		defaultAgent?: string;
		aboutUser?: string;
		assistantInstructions?: string;
	}

	interface ProviderInterface {
		id?: string;
		userID?: string;
		name: string;
		type: ProviderType;
		baseURL: string;
		apiKeys?: KeyInterface[];
		models?: ModelInterface[];
	}

	interface KeyInterface {
		id?: string;
		providerID: string;
		key: string;
		label: string;
	}

	interface ModelInterface {
		id?: string;
		name: string;
		displayName: string;
		images?: boolean;
		audio?: boolean;
		video?: boolean;
		prefill?: boolean;
		inputContext: number;
		providerID: string;
	}

	interface ProviderApiKeysInterface {
		id?: string;
		name: string;
		type: ProviderType;
		baseURL: string;
		apiKeys: {
			id?: string;
			providerID?: string;
			key: string;
			label: string;
		}[];
	}

	interface ProviderModelsInterface {
		id: string;
		name: string;
		models: {
			id?: string;
			name: string;
			display_name?: string;
			images: boolean;
			prefill: boolean;
			inputContext: number;
			providerID: string;
		}[];
	}

	interface AssistantInterface {
		id?: string;
		userID?: string;
		name: string;
		about?: string;
		model?: string;
		apiKey?: string;
		aboutUser?: string;
		aboutUserFromUser: boolean;
		assistantInstructions?: string;
		assistantInstructionsFromUser: boolean;
		systemPrompt?: string;
		images?: boolean;
		audio?: boolean;
		video?: boolean;
		prefill?: boolean;
	}

	interface ProviderAssistantInterface {
		id: string;
		name: string;
		type: string;
		models: {
			id: string;
			name: string;
			display_name: string;
			images: boolean;
			prefill: boolean;
			inputContext: number;
			providerID: string;
		}[];
		apiKeys: {
			id: string;
			label: string;
		}[];
	}

	interface MessageInterface {
		id?: string;
		conversationId: string;
		role: 'user' | 'assistant';
		text: string;
		usageIn?: number;
		usageOut?: number;
		finishReason?: string;
		deleted?: boolean;
	}

	interface ConversationInterface {
		id: string;
		userID?: string;
		assistant?: string;
		summary?: string;
		like?: boolean;
		deleted?: boolean;
		messages?: MessageInterface[];
	}
}

export {};
