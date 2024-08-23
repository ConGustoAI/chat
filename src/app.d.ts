import type { ProviderType } from '@prisma/client';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			session: Session | undefined;
			user: User | undefined;
			dbUser: UserInterface | undefined;
			assistants: AssistantInterface[];
			hiddenItems: Set<string>;
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
		avatar?: string;
		admin?: boolean;
		hacker?: boolean;
		assistant?: string;
		aboutUser?: string;
		assistantInstructions?: string;
		createdAt?: Date;
		updatedAt?: Date;
	}

	interface ProviderInterface {
		id?: string;
		userID: string;
		name: string;
		type: ProviderType;
		baseURL: string;
		apiKeys?: ApiKeyInterface[];
		models?: ModelInterface[];
		createdAt?: Date;
		updatedAt?: Date;
	}

	interface ApiKeyInterface {
		id?: string;
		userID: string;
		providerID: string;
		key: string;
		label: string;
		createdAt?: Date;
		updatedAt?: Date;
	}

	interface ModelInterface {
		id?: string;
		userID: string;
		name: string;
		displayName: string;
		images?: boolean;
		audio?: boolean;
		video?: boolean;
		prefill?: boolean;
		inputContext: number;
		outputContext: number;
		maxTemp: number;
		providerID: string;
		createdAt?: Date;
		updatedAt?: Date;
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
		temperature: number;
		topP: number;
		topK: number;
		maxTokens: number;
		images?: boolean;
		audio?: boolean;
		video?: boolean;
		prefill?: boolean;
		googleSafetyThreshold?: number;
		createdAt?: Date;
		updatedAt?: Date;
	}

	interface HiddenItemInterface {
		userID: string;
		id: string; // Can refer to assistants/providers/models/apikeys.
		createAt?: Date;
		updatedAt?: Date;
	}

	interface MessageInterface {
		id?: string;
		userID: string;
		order?: number;
		conversationId?: string;
		role: 'user' | 'assistant';
		text: string;
		usageIn?: number;
		usageOut?: number;
		finishReason?: string;
		deleted?: boolean;
		updatedAt?: Date;
		createdAt?: Date;
	}

	interface ConversationInterface {
		id?: string;
		order?: number;
		userID: string;
		assistant?: string;
		summary?: string;
		like?: boolean;
		deleted?: boolean;
		public?: boolean;
		messages?: MessageInterface[];
		updatedAt?: Date;
		createdAt?: Date;
	}
}

export {};
