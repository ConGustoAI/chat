import { db } from '$lib/db';
import { assistantsTable, modelsTable, providersTable, usersTable, seedTable, defaultsUUID } from './schema';
import dbg from 'debug';
const debug = dbg('app:db:seed');

// Provider IDs
export const anthropicProviderID = '8040ae6a-03cf-41b2-b1c7-c50b5fc3f54f';
export const OpenAIProviderID = '791894fc-fd55-4950-ba57-d4d7fa43d697';
export const GoogleProviderID = 'a5e3bbea-ba6e-4fa1-bdf6-4f1707f6efb0';

// Model IDs
// Anthropic models
const claude3OpusID = 'bfd0e5b5-8bc1-4573-9b41-d79ea3a7d0c7';
const claude3SonnetID = '5fff9a76-b593-4f41-af25-b9db13f52932';
const claude35SonnetID = '427a716d-846d-40b6-aab4-488c6e712edc';
const claude3HaikuID = '853e6fd0-6baa-4ed6-8b2c-bd494e2b81df';

// OpenAI models
const gpt4Turbo240409ID = '80515a6b-5068-4558-b22c-4740fbbdfdfd';
const gpt4oMiniID = '366ef585-d95e-4d84-8b1d-b079ffa0c244';
const gpt4oMini240718ID = '7b627f9d-40a8-47a2-ab62-3a851263639d';
const gpt4oID = 'e753210e-2e8f-42a2-9549-dfdc4af097d6';
const gpt4o240513ID = '13ed26fa-9faf-4318-8375-6e019428d795';
const gpt4o240806ID = 'ff8fe22c-cefb-4727-a2b1-6a5f71526827';
const chatGPT4oID = 'cd593a97-1ac3-4bb4-960d-c6031fd6857d';
const gpt4ID = '439763f3-dab7-4c79-9f94-074412ff6a85';
const gpt432kID = '328f61f8-9dd8-4c71-8095-80e4c8578464';
const gpt4TurboID = '3ca66d32-05d5-4565-9bc7-b5a8ba999b47';

// Google models
const gemini15ProID = '34145f59-e1f3-4ad1-b3bb-02b8ab9f1882';
const gemini15ProExp0801ID = '75ee6f78-37ba-42d9-a865-147424a5fc5f';
const gemini15ProExp0827ID = '6556bcaf-2a73-43dd-b114-a1ef5fdac4c5';
const gemini15FlashID = '98ede844-8124-40c9-aad5-65e1f3098452';

// Assistant IDs
const sonnet35ID = 'e068974a-e930-4345-8824-9397104a5030';
const chatGPT4oAssistantID = 'e06eec62-2c7d-415d-adc0-51fe6d62b5c6';
const geminiPro15ExpID = 'c3b91df2-2680-4f87-aca9-2111eca6a8c3';

export const seed = async () => {
	await db.transaction(async (tx) => {
		const select = await tx.query.seedTable.findFirst({ orderBy: (table, { desc }) => desc(table.seed) });
		debug(select);

		if (select?.seed ?? 0 < 1) {
			await seedDefaultUser(tx);
			await seedProviders(tx);
			await seedModels(tx);
			await seedAssistants(tx);
			await tx.insert(seedTable)
				.values([{ seed: 1 }])
				.onConflictDoNothing();
		}

	});
};

const seedProviders = async (tx: typeof db) => {
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

const seedModels = async (tx: typeof db) => {
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
				name: 'claude-3-sonnet-20240229',
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
				name: 'claude-3-5-sonnet-20240620',
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
				name: 'claude-3-haiku-20240307',
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

			// Google models
			{
				id: gemini15ProID,
				userID: defaultsUUID,
				displayName: 'Gemini 1.5 Pro',
				name: 'gemini-1.5-pro',
				images: true,
				maxImages: 3600,
				audio: true,
				maxAudio: 34200,
				video: true,
				maxVideo: 3600,
				inputContext: 2097152,
				outputContext: 8192,
				maxTemp: 2,
				providerID: GoogleProviderID,
				inputCost: 3.5,
				outputCost: 10.5
			},
			{
				id: gemini15ProExp0801ID,
				userID: defaultsUUID,
				displayName: 'Gemini 1.5 Pro Exp 0801',
				name: 'gemini-1.5-pro-exp-0801',
				images: true,
				audio: true,
				video: true,
				inputContext: 2097152,
				outputContext: 8192,
				maxTemp: 2,
				providerID: GoogleProviderID,
				inputCost: 3.5,
				outputCost: 10.5
			},
			{
				id: gemini15ProExp0827ID,
				userID: defaultsUUID,
				displayName: 'Gemini 1.5 Pro Exp 0827',
				name: 'gemini-1.5-pro-exp-0827',
				images: true,
				audio: true,
				video: true,
				inputContext: 2097152,
				outputContext: 8192,
				maxTemp: 2,
				providerID: GoogleProviderID,
				inputCost: 3.5,
				outputCost: 10.5
			},
			{
				id: gemini15FlashID,
				userID: defaultsUUID,
				displayName: 'Gemini 1.5 Pro Flash',
				name: 'gemini-1.5-flash',
				images: true,
				maxImages: 7200,
				audio: true,
				maxAudio: 68400,
				video: true,
				maxVideo: 7200,
				inputContext: 1048576,
				outputContext: 8192,
				maxTemp: 2,
				providerID: GoogleProviderID,
				inputCost: 0.75,
				outputCost: 0.3
			}
		])
		.onConflictDoNothing();
};

const seedAssistants = async (tx: typeof db) => {
	const defaultSystemPrompt = `
You are an intelligent and knowledgeable AI research assistant, excellent at reasoning, mathematics, logic, science, technology and programming.
You give short concise examples when appropriate. No yapping.
You do not reiterate what the user said. You don't give generic information that an intelligent user already knows.
Before answering, rephrase the user's prompt into <prompt>...</prompt>
Before answering, rate the difficulty of the question from "very easy", "easy", "intermediate", "hard", "very hard" in <d>...</d>
If important information is missing from the user's request, ask a follow-up question instead of answering.

Answer easier questions right away.You can answer in a single sentence or single word when appropriate.
For difficult questions, take time to think, analyze, and brainstorm the answer.
Consider 2 or 3 approaches before answering. Use <thought>, it's not shown to the user. You can use <thought> multiple times.

Information about the user:
<profile>{profile}</profile>
Before answering harder questions, consider whether the users' profile is relevant in <profile_relevance>.
Ignore the profile it's not relevant.
Don't remind the user of the information from the profile. Assume the information in the profile is correct.

Additional instructions:
<instructions>{instructions}</instructions>
`;

	await tx
		.insert(assistantsTable)
		.values([
			{
				id: sonnet35ID,
				userID: defaultsUUID,
				name: 'Sonnet 3.5',
				about: 'Aligned with Anthropics values',
				model: claude35SonnetID,
				apiKey: defaultsUUID,
				aboutUserFromUser: true,
				assistantInstructionsFromUser: true,
				systemPrompt: `You are Claude. ${defaultSystemPrompt}`,
				images: true,
				audio: false,
				video: false,
				prefill: true,
				temperature: 0,
				topP: 0,
				topK: 0,
				maxTokens: 0
			},
			{
				id: chatGPT4oAssistantID,
				userID: defaultsUUID,
				name: 'ChatGPT 4o',
				about: 'Very open',
				model: chatGPT4oID,
				apiKey: defaultsUUID,
				aboutUserFromUser: true,
				assistantInstructionsFromUser: true,
				systemPrompt: `You are ChatGPT. ${defaultSystemPrompt}`,
				images: false,
				audio: false,
				video: false,
				prefill: false,
				temperature: 0,
				topP: 0,
				topK: 0,
				maxTokens: 0
			},
			{
				id: geminiPro15ExpID,
				userID: defaultsUUID,
				name: 'Gemini Pro 1.5 exp',
				about: "I'm watching you",
				model: gemini15ProExp0827ID,
				apiKey: defaultsUUID,
				aboutUserFromUser: true,
				assistantInstructionsFromUser: true,
				systemPrompt: `You are Gemini. ${defaultSystemPrompt}`,
				images: true,
				audio: false,
				video: false,
				prefill: false,
				temperature: 0,
				topP: 0,
				topK: 0,
				maxTokens: 0,
				googleSafetyThreshold: 3
			}
		])
		.onConflictDoNothing();
};

const seedDefaultUser = async (tx: typeof db) => {
	await tx
		.insert(usersTable)
		.values([{ id: defaultsUUID, name: 'Default User' }])
		.onConflictDoNothing();
};
