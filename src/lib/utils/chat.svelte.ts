import { goto } from '$app/navigation';
import { APIupdateUser, APIupsertConversation, APIupsertMessage } from '$lib/api';
import { APIupsertPrompt } from '$lib/api/prompt';
import { A } from '$lib/appstate.svelte';
import { defaultsUUID } from '$lib/db/schema';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { streamText, type CoreAssistantMessage, type CoreUserMessage } from 'ai';
import dbg from 'debug';
import { assert, promptHash } from './utils';
const debug = dbg('app:lib:utils:chat');

export let abortController: AbortController | undefined = undefined;

export async function _submitConversationClientSide() {
	debug('submitConversation', $state.snapshot(A.conversation));

	if (!A.dbUser) {
		debug('submitConversation', 'not logged in, redirecting to login');
		await goto('/login');
		return;
	}

	if (!A.conversation) throw new Error('The conversation is missing.');
	if (!A.conversation.assistant) throw new Error('No assistant assigned.');
	if (!A.conversation.messages) throw new Error('The conversation messages are missing.');

	const assistant = A.assistants[A.conversation.assistant];
	if (!assistant) throw new Error('Selected assistant not avaiable');
	if (!assistant.modelID) throw new Error('Assistant has not model specified');
	if (!assistant.apiKeyID) throw new Error('Assistant has no API key specified');

	const model = A.models[assistant.modelID];
	if (!model) throw new Error('Selected assistant model not available');
	assert(model.providerID); // Can't have a model without provider.

	const provider = A.providers[model.providerID];
	if (!provider) throw new Error('provider not found');

	let apiKey: ApiKeyInterface | undefined;
	// Use first available key for this provider.
	if (assistant.apiKeyID === defaultsUUID) {
		apiKey = Object.values(A.apiKeys).find((k) => k.providerID === provider.id);
	} else {
		apiKey = A.apiKeys[assistant.apiKeyID];
	}
	if (!apiKey) throw new Error('Specified API key not found');

	const toSend = A.conversation.messages;

	if (toSend.length < 2) throw new Error('The conversation should have at least 2 messages.');
	if (toSend[toSend.length - 2].role !== 'user') throw new Error('The first message should be from the user.');
	if (toSend[toSend.length - 1].role !== 'assistant') {
		throw new Error('The last message should be from the assistant.');
	}
	const [UM, AM] = A.conversation.messages.slice(-2);
	if (AM.text && !assistant.prefill) throw new Error('Assistant does not support prefill');

	abortController = new AbortController();

	const oldMessages = A.conversation.messages.slice(0, -2);

	const userProfile = (assistant.aboutUserFromUser ? A.dbUser.aboutUser : assistant.aboutUser) ?? '';
	const assistantInstrictions =
		(assistant.assistantInstructionsFromUser ? A.dbUser.assistantInstructions : assistant.assistantInstructions) ?? '';

	let systemPromptText = (assistant.systemPrompt ?? '')
		.replace('{profile}', userProfile)
		.replace('{instructions}', assistantInstrictions);

	const systemPromptHash = await promptHash(systemPromptText);

	const clientSettings = { apiKey: apiKey.key, baseURL: provider.baseURL };

	let client;
	if (provider.type === 'openai') {
		const aiModel = createOpenAI({
			...clientSettings,
			// Some OpenAI-compatible providers don't support usage when streaming.
			compatibility: provider.openAIStreamUsage ? 'strict' : 'compatible'
		});
		client = aiModel(model.name);
	} else if (provider.type === 'anthropic') {
		const aiModel = createAnthropic({
			...clientSettings,
			headers: { 'anthropic-dangerous-direct-browser-access': 'true' }
		});
		client = aiModel(model.name);
	} else if (provider.type === 'google') {
		const theresholds = ['BLOCK_NONE', 'BLOCK_ONLY_HIGH', 'BLOCK_MEDIUM_AND_ABOVE', 'BLOCK_LOW_AND_ABOVE'];
		let threshold;
		if (
			assistant.googleSafetyThreshold !== undefined &&
			assistant.googleSafetyThreshold > 0 &&
			assistant.googleSafetyThreshold < 4
		) {
			threshold = theresholds[assistant.googleSafetyThreshold];
		} else {
			threshold = 'BLOCK_NONE';
		}

		const safetySettings = [
			{ category: 'HARM_CATEGORY_HARASSMENT', threshold },
			{ category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold },
			{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold },
			{ category: 'HARM_CATEGORY_HATE_SPEECH', threshold }
		];

		const aiModel = createGoogleGenerativeAI(clientSettings);
		// @ts-expect-error - google added more categories, waiting for Vercel AI to catcup up.
		client = aiModel('models/' + model.name, { safetySettings });
	} else {
		throw new Error('Unsupported provider type, this is a bug');
	}

	const inputMessages: (CoreAssistantMessage | CoreUserMessage)[] = [...oldMessages, UM, ...(AM.text ? [AM] : [])].map(
		(m) => ({
			role: m.role,
			content: [{ type: 'text', text: m.text }]
		})
	);

	A.conversation.assistantName = assistant.name;
	A.conversation.model = model.id;
	A.conversation.modelName = model.name;
	A.conversation.provider = provider.id;
	A.conversation.providerName = provider.name;

	if (!A.conversation.id) {
		Object.assign(A.conversation, await APIupsertConversation($state.snapshot(A.conversation)));
	}

	if (!A.conversation.id) throw new Error('Failed to create conversation');

	UM.conversationID = A.conversation.id;
	AM.conversationID = A.conversation.id;

	const prompt = { id: systemPromptHash, text: systemPromptText}

	if (provider.type === 'openai' && model.name.startsWith('o1') && systemPromptText) {
		inputMessages.unshift({
			role: 'user',
			content: [{ type: 'text', text: 'SYSTEM PROMPT:\n' + systemPromptText }]
		});
		systemPromptText = '';
	}

	async function onFinish(
		// I don't always love TypeScript
		result: NonNullable<Parameters<NonNullable<Parameters<typeof streamText>[0]['onFinish']>>>[0]
	): Promise<void> {
		debug('streamText result:', JSON.stringify(result, null, 2));
		assert(A.conversation);
		assert(A.dbUser);

		const reasoningTokens = result.experimental_providerMetadata?.openai?.reasoningTokens as number | undefined;

		AM.finishReason = result.finishReason;
		AM.tokensIn = isNaN(result.usage.promptTokens) ? 0 : result.usage.promptTokens;
		AM.tokensOut = isNaN(result.usage.completionTokens) ? 0 : result.usage.completionTokens;
		AM.tokensInCost = model.inputCost ? (AM.tokensIn / 1000000) * model.inputCost : 0;
		AM.tokensOutCost = model.outputCost ? (AM.tokensOut / 1000000) * model.outputCost : 0;
		AM.tokensReasoning = reasoningTokens && isNaN(reasoningTokens) ? 0 : reasoningTokens;
		AM.tokensReasoningCost = model.outputCost ? ((AM.tokensReasoning ?? 0) / 1000000) * model.outputCost : 0;
		// AM.text += result.text;
		AM.assistantID = assistant.id;
		AM.assistantName = assistant.name;
		AM.model = model.id;
		AM.modelName = model.name;
		AM.temperature = assistant.temperature;
		AM.topP = assistant.topP;
		AM.topK = assistant.topK;
		AM.promptID = systemPromptHash;
		AM.prompt = prompt;

		AM.markdownCache = undefined;

		A.conversation.tokensIn = (A.conversation.tokensIn ?? 0) + AM.tokensIn;
		A.conversation.tokensOut = (A.conversation.tokensOut ?? 0) + AM.tokensOut;
		A.conversation.tokensInCost = (A.conversation.tokensInCost ?? 0) + AM.tokensInCost;
		A.conversation.tokensOutCost = (A.conversation.tokensOutCost ?? 0) + AM.tokensOutCost;
		if (AM.tokensReasoning) A.conversation.tokensReasoning = (A.conversation.tokensReasoning ?? 0) + AM.tokensReasoning;
		if (AM.tokensReasoningCost)
			A.conversation.tokensReasoningCost = (A.conversation.tokensReasoningCost ?? 0) + AM.tokensReasoningCost;

		A.dbUser.lastAssistant = assistant.id;

		debug('Assistant message after stats: %o', AM);

		// insert the user messages first to avoid inserting them out of order.
		// The system prompt should be inserted before the assistant message.
		const [iUM, iP] = await Promise.all([
			APIupsertMessage($state.snapshot(UM)),
			APIupsertPrompt(prompt)
		]);

		// Insert/update the rest in parallel
		const [iAM, iC, iU] = await Promise.all([
			APIupsertMessage($state.snapshot(AM)),
			APIupsertConversation($state.snapshot(A.conversation)),
			async () => {
				if (A.dbUser) {
					if (A.dbUser.lastAssistant != assistant.id) {
						A.dbUser.lastAssistant = assistant.id;
					}
					await APIupdateUser(A.dbUser);
				}
			}
		]);

		iAM.prompt = iP;
		debug('After updating the DB: %o', {
			userMessage: iUM,
			assistantMessage: iAM,
			conversation: iC,
			prompt: iP,
			user: iU
		});
	}

	let timestamp = Date.now();
	async function onChunk(event: NonNullable<Parameters<NonNullable<Parameters<typeof streamText>[0]['onChunk']>>>[0]) {
		const chunk = event.chunk;
		assert(chunk);

		if (chunk.type == 'text-delta') {
			AM.text += chunk.textDelta;
			if (Date.now() - timestamp > 100) {
				timestamp = Date.now();
				AM.markdownCache = undefined;
			}
		} else {
			debug('Chunk: ', chunk);
		}
	}

	// try {
	const res = await streamText({
		model: client,
		messages: inputMessages,
		system: systemPromptText?.trim().length ? systemPromptText : undefined,
		temperature: assistant.temperature,
		topP: assistant.topP,
		topK: assistant.topK,
		maxTokens: assistant.maxTokens || undefined,
		onFinish,
		onChunk,
		abortSignal: abortController.signal
	});

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	for await (const _ of res.textStream);
}

export async function submitConversationClientSide() {
	A.chatStreaming = true;
	try {
		await _submitConversationClientSide();
	} catch (e) {
		if (e instanceof Error) {
			const E = e as Error;

			if (E.name === 'AbortError') {
				// The conversation was aborted, and thus was not saved on the server side.
				// We need to save the conversation and the messages locally and update it in the database.
				debug('submitConversation', 'aborted');
				if (A.conversation && A.conversation.messages && A.conversation.messages?.length >= 2) {
					// const newConversation = await APIupsertConversation($state.A.conversation);
					if (!A.conversation.id) throw new Error('The conversation ID is missing.');

					let userMessage = A.conversation.messages[A.conversation.messages.length - 2];

					userMessage = {
						...userMessage,
						conversationID: A.conversation.id
					};

					A.conversation.messages[A.conversation.messages.length - 2] = await APIupsertMessage($state.snapshot(userMessage));

					let assistantMessage = A.conversation.messages[A.conversation.messages.length - 1];

					assistantMessage = {
						...assistantMessage,
						finishReason: 'aborted',
						assistantID: A.conversation.assistant,
						assistantName: A.assistants[A.conversation.assistant ?? 'unknown']?.name ?? 'Unknown',
						model: A.assistants[A.conversation.assistant ?? 'unknown']?.modelID ?? 'Unknown',
						modelName:
							A.models[A.assistants[A.conversation.assistant ?? 'unknown']?.modelID ?? 'unknown']?.name ?? 'Unknown',
						temperature: A.assistants[A.conversation.assistant ?? 'unknown']?.temperature ?? 0,
						topP: A.assistants[A.conversation.assistant ?? 'unknown']?.topP ?? 0,
						topK: A.assistants[A.conversation.assistant ?? 'unknown']?.topK ?? 0,
						conversationID: A.conversation.id
					};

					A.conversation.messages[A.conversation.messages.length - 1] = await APIupsertMessage(assistantMessage);

					// A.conversation = { ...A.conversation, ...newConversation };

				}
			} else throw Error('Failed to process the conversation: ' + e.message);
		} else {
			throw new Error('Failed to process the conversation: An unknown error occurred');
		}
	} finally {

		if (A.conversation?.id && !A.conversations[A.conversation.id]) {
			A.conversations[A.conversation.id] = A.conversation;
			A.conversationOrder = [A.conversation.id!, ...A.conversationOrder];
		}

		A.chatStreaming = false;
	}
}