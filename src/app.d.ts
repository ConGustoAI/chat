import type { ProviderType } from '@prisma/client';
import { User, Session } from 'lucia';

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
		modelID?: string;
		apiKeyID?: string;
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
		createdAt?: Date;
		updatedAt?: Date;
	}

	interface MessageInterface {
		id?: string;
		userID: string;
		order?: number;
		conversationID?: string;
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
		tokensReasoning?: number;
		tokensReasoningCost?: number;
		requestID?: string;
		finishReason?: string;
		temperature?: number;
		topP?: number;
		topK?: number;
		deleted?: boolean;

		mediaIDs?: string[];

		// Don't send to the backend.
		updatedAt?: Date;
		createdAt?: Date;

		// Used by the frontend, not in the database.
		markdownCache?: string; // This is only used in the frontend, not saved to the database.
		media?: MediaInterface[];
		prompt?: PromptInterface;

		editing?: boolean;
		originalText?: string; // Saven when editing to be able to cancel the edit.
		uploadOpen?: boolean;
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
		// For o1 models.
		tokensReasoning?: number;
		tokensReasoningCost?: number;
		messages?: MessageInterface[];
		updatedAt?: Date;
		createdAt?: Date;

		// From relations, not in database.
		messages?: MessageInterface[];
		// All media for this conversation, including new media.
		media?: MediaInterface[];
	}

	interface MediaInterface {
		id?: string;
		userID: string;
		conversationID?: string;
		repeat?: boolean;

		title: string;
		filename: string;
		type: 'image' | 'audio' | 'video' | 'text' | 'pdf';

		originalWidth?: number;
		originalHeight?: number;
		originalDuration?: number;

		resizedWidth?: number;
		resizedHeight?: number;

		cropStartX?: number;
		cropStartY?: number;
		cropEndX?: number;
		cropEndY?: number;

		trimStart?: number;
		trimEnd?: number;

		originalID?: string | null;
		thumbnailID?: string | null;

		createdAt?: Date;
		updatedAt?: Date;

		// Don't send to the backend.

		// From relations, not in database.
		original?: FileInterface;
		thumbnail?: FileInterface;

		// Used by the frontend
		resized?: FileInterface;
		cropped?: FileInterface;

		active?: boolean;
	}

	interface FileInterface {
		id?: string;
		userID: string;

		size: number;
		mimeType: string;
		isThumbnail?: boolean;

		status?: 'progress' | 'ok' | 'failed' | null;

		// Don't send to the backend.

		createdAt?: Date;
		updatedAt?: Date;

		// Used by the frontend only.
		text?: string; // For text files, the text content.

		file?: File; // A freshly selected file will have a file object.
		url?: string; // A file that has been uploaded will have a URL.
		uploadURL?: string;

		uploadProgress?: number;
		uploadError?: string;
		uploading?: boolean;
	}

	type undefinedNull = undefined | null;

	interface TokenStats {
		tokensIn?: number;
		tokensOut?: number;
		tokensInCost?: number;
		tokensOutCost?: number;
		tokensReasoning?: number;
		tokensReasoningCost?: number;
	}
}

export {};
