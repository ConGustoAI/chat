import { db } from '$lib/db';
import { eq } from 'drizzle-orm';
import { AuthUsersTable, assistantsTable, defaultsUUID, modelsTable, providersTable, usersTable } from './schema';

const myUSerID = '7c48c881-dd3b-4611-9d63-00358a7a500a';

export const seed = async () => {
	await db.transaction(async (tx) => {
		// await tx.delete(AuthUsersTable).where(eq(AuthUsersTable.id, defaultsUUID));
		// await tx.insert(AuthUsersTable).values({
		// 	id: defaultsUUID
		// });

		await db.delete(usersTable).where(eq(usersTable.id, myUSerID)).execute();

		await tx
			.insert(usersTable)
			.values({
				id: myUSerID,
				name: 'Default settings',
				assistantInstructions: 'Be a good Bing',
				aboutUser: 'Default user about'
			})
			.execute();

		const providers = await tx
			.insert(providersTable)
			.values([
				{
					userID: myUSerID,
					name: 'OpenAI',
					type: 'openai',
					baseURL: 'https://api.openai.com/v1'
				},
				{
					userID: myUSerID,
					name: 'Anthropic',
					type: 'anthropic',
					baseURL: 'https://api.anthropic.com/v1'
				},
				{
					userID: myUSerID,
					name: 'Google',
					type: 'google',
					baseURL: 'https://generativelanguage.googleapis.com/v1/'
				}
			])
			.returning({ id: providersTable.id });

		const models = await tx
			.insert(modelsTable)
			.values([
				// OpenAI models
				{
					display_name: 'GPT 3.5 Turbo',
					images: false,
					prefill: false,
					name: 'gpt-3.5-turbo',
					providerID: providers[0].id,
					inputContext: 8192
				},
				{
					display_name: 'GPT 4o',
					images: true,
					name: 'gpt-4o',
					providerID: providers[0].id,
					inputContext: 128000
				},
				{
					display_name: 'GPT 4o mini',
					images: true,
					name: 'gpt-4o-mini',
					providerID: providers[0].id,
					inputContext: 128000
				},
				{
					display_name: 'GPT 4',
					images: false,
					prefill: false,
					name: 'gpt-4',
					providerID: providers[0].id,
					inputContext: 8192
				},
				{
					display_name: 'GPT 4 Turbo',
					images: false,
					prefill: false,
					name: 'gpt-4-turbo-preview',
					providerID: providers[0].id,
					inputContext: 128000
				},

				// Anthropic models
				{
					display_name: 'Claude 3.5 Sonnet',
					images: true,
					maxImages: 20,
					imageTokens: 1 / 750,
					prefill: true,
					name: 'claude-3-5-sonnet-20240620',
					providerID: providers[1].id,
					inputContext: 200000
				},
				{
					display_name: 'Claude 3 Opus',
					images: true,
					maxImages: 20,
					imageTokens: 1 / 750,
					prefill: true,
					name: 'claude-3-opus-20240229',
					providerID: providers[1].id,
					inputContext: 200000
				},
				{
					display_name: 'Claude 3 Sonnet',
					images: true,
					maxImages: 20,
					imageTokens: 1 / 750,
					prefill: true,
					name: 'claude-3-sonnet-20240229',
					providerID: providers[1].id,
					inputContext: 200000
				},
				{
					display_name: 'Claude 3 Haiku',
					images: true,
					maxImages: 20,
					imageTokens: 1 / 750,
					prefill: true,
					name: 'claude-3-haiku-20240307',
					providerID: providers[1].id,
					inputContext: 200000
				},

				// Google models
				{
					display_name: 'Gemini 1.5 Pro',
					images: true,
					maxImages: 3600,
					video: true,
					maxVideo: 3600,
					audio: true,
					maxAudio: 9.5 * 3600,
					name: 'gemini-1.5-pro',
					providerID: providers[2].id,
					inputContext: 2097152
				},
				{
					display_name: 'Gemini 1.5 Pro Flash',
					maxImages: 7200,
					video: true,
					maxVideo: 2 * 3600,
					audio: true,
					maxAudio: 19 * 3600,
					name: 'gemini-1.5-flash',
					providerID: providers[2].id,
					inputContext: 1048576
				}
			])
			.returning({ id: modelsTable.id });

		await tx
			.insert(assistantsTable)
			.values([
				{
					userID: myUSerID,
					name: 'Default Assistant',
					about: 'Default assistant about',
					model: models[0].id
				}
			])
			.execute();
	});
};
