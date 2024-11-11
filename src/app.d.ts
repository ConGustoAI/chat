import type { ProviderType } from '@prisma/client';
import { User, Session } from 'lucia';
import type { PDFDocumentProxy } from 'pdfjs-dist';

declare global {
	namespace $state {
		type MyPrimitive = string | number | boolean | null | undefined | Promise;

		type MySnapshot<T> = T extends MyPrimitive
			? T
			: T extends Cloneable
				? NonReactive<T>
				: T extends { toJSON(): infer R }
					? R
					: T extends Array<infer U>
						? Array<Snapshot<U>>
						: T extends object
							? T extends { [key: string]: unknown }
								? { [K in keyof T]: Snapshot<T[K]> }
								: never
							: never;

		export function snapshot<T>(state: T): MySnapshot<T>;
	}

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
		advancedInput?: boolean;
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
		// apiKeys?: ApiKeyInterface[];
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
		usage: number;
		remainder: number;
		createdAt?: Date;
		updatedAt?: Date;
	}

	interface ModelInterface {
		id?: string;
		userID: string;
		name: string;
		displayName: string;
		streaming?: boolean;
		prefill?: boolean;
		images?: boolean;
		audio?: boolean;
		video?: boolean;
		pdf?: boolean;
		inputContext: number;
		outputContext: number;
		inputCost?: number; // Cost in dollars per 1,000,000 tokens
		outputCost?: number;
		maxTemp: number;

		maxImages?: number;
		imageTokens?: number; // tokens per pixel
		maxAudio?: number;
		audioTokens?: number; // tokens per second
		maxVideo?: number;
		videoTokens?: number; // tokens per second

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
		prefill?: boolean;
		images?: boolean;
		audio?: boolean;
		video?: boolean;
		pdf?: boolean;
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
		modelID?: string;
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

		messagesSent?: string;
		result?: string;
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
		assistantID?: string;

		// Used for search.
		assistantName?: string;
		modelID?: string;
		modelName?: string;
		providerID?: string;
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

		updatedAt?: Date;
		createdAt?: Date;

		// From relations, not in database.
		messages?: MessageInterface[];
		// All media for this conversation, including new media.
		media?: MediaInterface[];
	}

	interface PDFMeta {
		numPages: number;
		author?: string;
		subject?: string;
		title?: string;
	}

	interface DerivedImageInterface extends FileInterface {
		width: number;
		height: number;
		timestamp?: number; // For video images.
	}

	interface MediaInterface {
		id?: string;
		order?: number;
		userID: string;
		conversationID?: string;
		repeat?: boolean;

		title: string;
		filename: string;
		type: 'image' | 'audio' | 'video' | 'text' | 'pdf';

		// Only valid for pdf files.
		PDFAsImages?: boolean;
		PDFAsImagesDPI?: number;
		PDFAsDocument?: boolean;
		PDFAsFile?: boolean;

		videoAsImages?: boolean;
		videoAsFile?: boolean;

		// For PDF and video that has been converted to images, we can skip pages/frames.
		imagesSkip?: number[];

		// For images and video
		originalWidth?: number;
		originalHeight?: number;

		// For audio and video
		originalDuration?: number;

		resizedWidth?: number;
		resizedHeight?: number;

		cropStartX?: number;
		cropStartY?: number;
		cropEndX?: number;
		cropEndY?: number;

		// For video and audio
		trimStart?: number;
		trimEnd?: number;

		originalID?: string | null;

		createdAt?: Date;
		updatedAt?: Date;

		// Don't send to the backend.

		// From relations, not in database.
		original: FileInterface;

		// Used by the frontend.

		// Only valid for text
		text?: string;

		thumbnail?: Promise<FileInterface>;

		transformed?: Promise<FileInterface>;
		// cropped?: FileInterface;

		PDFDocument?: Promise<PDFDocumentProxy>;
		// Promises that resolve to the iobject URLs.
		PDFMeta?: Promise<PDFMeta>;

		// For converting video or PDF to images.
		derivedImages?: Promise<DerivedImageInterface>[];

		active?: boolean;
		processing?: number;
	}

	// interface GoogleUploadInterface {
	// 	createTime: string | Date;
	// 	displayName: string | Date;
	// 	expirationTime: string | Date;
	// 	mimeType: string;
	// 	name: string; // files/sdfsdfsdf
	// 	displayName: string; // Human readable name.
	// 	sha256Hash: string; // Base64 encoded.
	// 	sizeBytes: string;
	// 	state: 'PROCESSING' | 'ACTIVE' | 'FAILED' | 'STATE_UNSPECIFIED';
	// 	updateTime: string;
	// 	uri: string;
	// }

	interface FileInterface {
		id?: string;
		userID: string;

		size: number;
		mimeType: string;
		isThumbnail?: boolean;

		status?: 'progress' | 'ok' | 'failed' | null;

		googleUploadFileID?: string;
		googleUploadFileURI?: string;
		googleUploadExpiresAt?: string;

		// Don't send to the backend.

		createdAt?: Date;
		updatedAt?: Date;

		file?: File; // A freshly selected file will have a file object.
		url?: string; // A file that has been uploaded will have a URL.
		uploadURL?: string;

		uploadProgress?: number;
		uploadError?: string;
		uploading?: boolean;

		// googelUpload?: GoogleUploadInterface;
	}

	type undefinedNull = undefined | null;

	interface TokenStatsInterface {
		tokensIn?: number;
		tokensOut?: number;
		tokensInCost?: number;
		tokensOutCost?: number;
		tokensReasoning?: number;
		tokensReasoningCost?: number;
	}
}

export {};
