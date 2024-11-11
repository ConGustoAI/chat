import type { db } from '$lib/db';
import { defaultsUUID, modelsTable, providersTable } from '$lib/db/schema';

// Provider IDs
export const anthropicProviderID = '8040ae6a-03cf-41b2-b1c7-c50b5fc3f54f';
export const OpenAIProviderID = '791894fc-fd55-4950-ba57-d4d7fa43d697';
export const GoogleProviderID = 'a5e3bbea-ba6e-4fa1-bdf6-4f1707f6efb0';

// Model IDs
// Anthropic models
export const claude3OpusID = 'bfd0e5b5-8bc1-4573-9b41-d79ea3a7d0c7';
export const claude3SonnetID = '5fff9a76-b593-4f41-af25-b9db13f52932';
export const claude35SonnetID = '427a716d-846d-40b6-aab4-488c6e712edc';
export const claude3HaikuID = '853e6fd0-6baa-4ed6-8b2c-bd494e2b81df';

// OpenAI models
export const gpt4Turbo240409ID = '80515a6b-5068-4558-b22c-4740fbbdfdfd';
export const gpt4oMiniID = '366ef585-d95e-4d84-8b1d-b079ffa0c244';
export const gpt4oMini240718ID = '7b627f9d-40a8-47a2-ab62-3a851263639d';
export const gpt4oID = 'e753210e-2e8f-42a2-9549-dfdc4af097d6';
export const gpt4o240513ID = '13ed26fa-9faf-4318-8375-6e019428d795';
export const gpt4o240806ID = 'ff8fe22c-cefb-4727-a2b1-6a5f71526827';
export const chatGPT4oID = 'cd593a97-1ac3-4bb4-960d-c6031fd6857d';
export const gpt4ID = '439763f3-dab7-4c79-9f94-074412ff6a85';
export const gpt432kID = '328f61f8-9dd8-4c71-8095-80e4c8578464';
export const gpt4TurboID = '3ca66d32-05d5-4565-9bc7-b5a8ba999b47';
export const o1PreviewID = '249f9912-7142-11ef-b336-3b44061dd216';
export const o1MiniID = '278475a8-7142-11ef-99f6-cf2e173cd0c4';

// Google models
export const gemini15ProID = '34145f59-e1f3-4ad1-b3bb-02b8ab9f1882';
export const gemini15ProExp0801ID = '75ee6f78-37ba-42d9-a865-147424a5fc5f';
export const gemini15ProExp0827ID = '6556bcaf-2a73-43dd-b114-a1ef5fdac4c5';
export const gemini15FlashID = '98ede844-8124-40c9-aad5-65e1f3098452';
export const gemini15Flash8BID = 'e71e67da-9234-11ef-b7fd-6f3990198700';

export const seedProviders = async (tx: typeof db) => {
	await tx
		.insert(providersTable)
		.values([
			{
				id: anthropicProviderID,
				userID: defaultsUUID,
				name: 'Anthropic',
				type: 'anthropic',
				baseURL: 'https://api.anthropic.com/v1'
			},
			{
				id: OpenAIProviderID,
				userID: defaultsUUID,
				name: 'OpenAI',
				type: 'openai',
				baseURL: 'https://api.openai.com/v1'
			},
			{
				id: GoogleProviderID,
				userID: defaultsUUID,
				name: 'Google',
				type: 'google',
				baseURL: 'https://generativelanguage.googleapis.com/v1beta'
			}
		])
		.onConflictDoNothing();
};

export const seedModels = async (tx: typeof db) => {
	await tx
		.insert(modelsTable)
		.values([
			// Anthropic models
			{
				id: claude3OpusID,
				userID: defaultsUUID,
				displayName: '3 Opus',
				name: 'claude-3-opus-20240229',
				images: true,
				maxImages: 20,
				imageTokens: 0.00133333,
				prefill: true,
				inputContext: 200000,
				outputContext: 4096,
				maxTemp: 2,
				providerID: anthropicProviderID,
				inputCost: 15,
				outputCost: 75
			},
			{
				id: claude3SonnetID,
				userID: defaultsUUID,
				displayName: '3 Sonnet',
				name: 'claude-3-sonnet-latest',
				images: true,
				maxImages: 20,
				imageTokens: 0.00133333,
				prefill: true,
				inputContext: 200000,
				outputContext: 4096,
				maxTemp: 2,
				providerID: anthropicProviderID,
				inputCost: 3,
				outputCost: 15
			},
			{
				id: claude35SonnetID,
				userID: defaultsUUID,
				displayName: '3.5 Sonnet',
				name: 'claude-3-5-sonnet-latest',
				images: true,
				maxImages: 20,
				imageTokens: 0.00133333,
				prefill: true,
				inputContext: 200000,
				outputContext: 8192,
				maxTemp: 2,
				providerID: anthropicProviderID,
				inputCost: 3,
				outputCost: 15
			},
			{
				id: claude3HaikuID,
				userID: defaultsUUID,
				displayName: '3 Haiku',
				name: 'claude-3-haiku-latest',
				images: true,
				maxImages: 20,
				imageTokens: 0.00133333,
				prefill: true,
				inputContext: 200000,
				outputContext: 4096,
				maxTemp: 2,
				providerID: anthropicProviderID,
				inputCost: 0.25,
				outputCost: 1.25
			},

			// OpenAI models
			{
				id: gpt4Turbo240409ID,
				userID: defaultsUUID,
				displayName: 'GPT 4 turbo 24-04-09',
				name: 'gpt-4-turbo-2024-04-09',
				inputContext: 128000,
				outputContext: 4096,
				maxTemp: 2,
				providerID: OpenAIProviderID,
				inputCost: 10,
				outputCost: 30
			},
			{
				id: gpt4oMiniID,
				userID: defaultsUUID,
				displayName: 'GPT 4o mini',
				name: 'gpt-4o-mini',
				images: true,
				prefill: false,
				inputContext: 128000,
				outputContext: 16384,
				maxTemp: 2,
				providerID: OpenAIProviderID,
				inputCost: 0.15,
				outputCost: 0.6
			},
			{
				id: gpt4oMini240718ID,
				userID: defaultsUUID,
				displayName: 'GPT 4o mini 24-07-18',
				name: 'gpt-4o-mini-24-07-18',
				images: true,
				prefill: false,
				inputContext: 128000,
				outputContext: 16384,
				maxTemp: 2,
				providerID: OpenAIProviderID,
				inputCost: 0.15,
				outputCost: 0.6
			},
			{
				id: gpt4oID,
				userID: defaultsUUID,
				displayName: 'GPT 4o',
				name: 'gpt-4o',
				images: true,
				prefill: true,
				inputContext: 128000,
				outputContext: 16384,
				maxTemp: 2,
				providerID: OpenAIProviderID,
				inputCost: 5,
				outputCost: 15
			},
			{
				id: gpt4o240513ID,
				userID: defaultsUUID,
				displayName: 'GPT 4o 24-05-13',
				name: 'gpt-4o-24-05-13',
				images: true,
				prefill: true,
				inputContext: 128000,
				outputContext: 16384,
				maxTemp: 2,
				providerID: OpenAIProviderID,
				inputCost: 5,
				outputCost: 15
			},
			{
				id: gpt4o240806ID,
				userID: defaultsUUID,
				displayName: 'GPT 4o 24-08-06',
				name: 'gpt-4o-24-08-06',
				images: true,
				prefill: true,
				inputContext: 128000,
				outputContext: 16384,
				maxTemp: 2,
				providerID: OpenAIProviderID,
				inputCost: 5,
				outputCost: 15
			},
			{
				id: chatGPT4oID,
				userID: defaultsUUID,
				displayName: 'ChatGPT 4o',
				name: 'chatgpt-4o-latest',
				images: true,
				inputContext: 128000,
				outputContext: 16384,
				maxTemp: 2,
				providerID: OpenAIProviderID,
				inputCost: 5,
				outputCost: 15
			},
			{
				id: gpt4ID,
				userID: defaultsUUID,
				displayName: 'GPT 4',
				name: 'gpt-4',
				inputContext: 8192,
				outputContext: 4096,
				maxTemp: 2,
				providerID: OpenAIProviderID,
				inputCost: 30,
				outputCost: 60
			},
			{
				id: gpt432kID,
				userID: defaultsUUID,
				displayName: 'GPT 4 32K',
				name: 'gpt-4-32k',
				inputContext: 32768,
				outputContext: 4096,
				maxTemp: 2,
				providerID: OpenAIProviderID,
				inputCost: 60,
				outputCost: 120
			},
			{
				id: gpt4TurboID,
				userID: defaultsUUID,
				displayName: 'GPT 4 Turbo',
				name: 'gpt-4-turbo',
				inputContext: 128000,
				outputContext: 4096,
				maxTemp: 2,
				providerID: OpenAIProviderID,
				inputCost: 10,
				outputCost: 30
			},
			{
				id: o1PreviewID,
				userID: defaultsUUID,
				displayName: 'o1 Preview',
				name: 'o1-preview',
				inputContext: 128000,
				outputContext: 32768,
				maxTemp: 2,
				providerID: OpenAIProviderID,
				inputCost: 15,
				outputCost: 60
			},
			{
				id: o1MiniID,
				userID: defaultsUUID,
				displayName: 'o1 Mini',
				name: 'o1-mini',
				inputContext: 128000,
				outputContext: 65536,
				maxTemp: 2,
				providerID: OpenAIProviderID,
				inputCost: 3,
				outputCost: 12
			},
			// Google models
			{
				id: gemini15ProID,
				userID: defaultsUUID,
				displayName: 'Gemini 1.5 Pro',
				name: 'gemini-1.5-pro-latest',
				images: true,
				maxImages: 3600,
				audio: true,
				maxAudio: 34200,
				video: true,
				maxVideo: 3600,
				pdf: true,
				inputContext: 2097152,
				outputContext: 8192,
				maxTemp: 2,
				providerID: GoogleProviderID,
				inputCost: 1.25,
				outputCost: 5
			},
			{
				id: gemini15FlashID,
				userID: defaultsUUID,
				displayName: 'Gemini 1.5 Flash',
				name: 'gemini-1.5-flash-latest',
				images: true,
				maxImages: 3600,
				audio: true,
				maxAudio: 68400,
				video: true,
				maxVideo: 7200,
				pdf: true,
				inputContext: 1048576,
				outputContext: 8192,
				maxTemp: 2,
				providerID: GoogleProviderID,
				inputCost: 0.75,
				outputCost: 0.3
			},
			{
				id: gemini15Flash8BID,
				userID: defaultsUUID,
				displayName: 'Gemini 1.5 Flash 8B',
				name: 'gemini-1.5-flash-8b-latest',
				images: true,
				audio: true,
				video: true,
				pdf: true,
				inputContext: 1048576,
				outputContext: 8192,
				maxTemp: 2,
				providerID: GoogleProviderID,
				inputCost: 0.375,
				outputCost: 0.15
			}
		])
		.onConflictDoNothing();
};
