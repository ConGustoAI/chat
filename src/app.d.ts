import type { ProviderType } from '@prisma/client';
import {  User, Session} from 'lucia'

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			user: User | null;
			session: Session | null;
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
		lastAssistant?: string;
		aboutUser?: string;
		assistantInstructions?: string;
		costShow?: number;
		costWarn1?: number;
		costWarn2?: number;
		showInfo?: boolean;
		showEstimate?: boolean;
		createdAt?: Date;
		updatedAt?: Date;
	}

	interface ProviderInterface {
		id?: string;
		userID: string;
		name: string;
		type: ProviderType;
		openAIStreamUsage?: boolean;
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
		streaming?: boolean;
		images?: boolean;
		audio?: boolean;
		video?: boolean;
		prefill?: boolean;
		inputContext: number;
		outputContext: number;
		inputCost?: number; // Cost in dollars per 1,000,000 tokens
		outputCost?: number;
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
		assistantID?: string;
		assistantName?: string;
		model?: string;
		modelName?: string;
		promptID?: string;
		role: 'user' | 'assistant';
		text: string;
		tokensIn?: number;
		tokensOut?: number;
		tokensInCost?: number;
		tokensOutCost?: number;
		requestID?: string;
		finishReason?: string;
		temperature?: number;
		topP?: number;
		topK?: number;
		deleted?: boolean;
		prompt?: PromptInterface;
		updatedAt?: Date;
		createdAt?: Date;
		markdownCache?: string; // This is only used in the frontend, not saved to the database.
	}

	interface PromptInterface {
		id: string;
		text: string;
		createdAt?: Date;
		updatedAt?: Date;
	}

	interface ConversationInterface {
		id?: string;
		order?: number;
		userID: string;
		assistant?: string;
		// Used for search.
		assistantName?: string;
		model?: string;
		modelName?: string;
		provider?: string;
		providerName?: string;

		summary?: string;
		like?: boolean;
		deleted?: boolean;
		public?: boolean;
		tokensIn?: number;
		tokensOut?: number;
		tokensInCost?: number;
		tokensOutCost?: number;
		messages?: MessageInterface[];
		updatedAt?: Date;
		createdAt?: Date;
	}
}

export {};
