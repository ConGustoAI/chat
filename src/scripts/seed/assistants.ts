import type { db } from "$lib/db";
import { assistantsTable, defaultsUUID } from "$lib/db/schema";
import { chatGPT4oID, claude35SonnetID, gemini15ProExp0827ID } from "./providers";


// Assistant IDs
const sonnet35ID = 'e068974a-e930-4345-8824-9397104a5030';
const chatGPT4oAssistantID = 'e06eec62-2c7d-415d-adc0-51fe6d62b5c6';
const geminiPro15ExpID = 'c3b91df2-2680-4f87-aca9-2111eca6a8c3';

export const seedAssistants = async (tx: typeof db) => {
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
