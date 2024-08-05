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
		userID: string;
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

	interface ConversationInterface {
		id: string;
		assistant?: string;
		summary?: string;
		like?: boolean;
		messages?: {
			id?: string;
			conversationId?: string;
			role: 'user' | 'assistant';
			text: string;
			usageIn?: number;
			usageOut?: number;
			finishReason?: string;
			deleted?: boolean;
		}[];
	}
}

export {};
