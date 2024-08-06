import { error } from '@sveltejs/kit';
import { apiKeysTable, assistantsTable, providersTable } from './db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { db } from './db';
import { undefineExtras } from './utils';

export async function S_getModels(userID: string) {
	const models = await db.query.providersTable.findMany({
		where: (table, { eq, and }) => and(eq(table.userID, userID)),
		columns: {},
		with: {
			models: true
		}
	});

	return models;
}

export async function S_getKeys(userID: string) {
	const keys = await db.query.providersTable.findMany({
		where: (table, { eq, and }) => and(eq(table.userID, userID)),
		columns: {},
		with: {
			apiKeys: true
		}
	});

	return keys;
}

export async function S_getKey(id: string, userID: string) {
	const key = await db.query.providersTable.findFirst({
		where: (table, { eq, and }) => and(eq(table.userID, userID)),
		with: {
			apiKeys: {
				where: (table, { eq }) => eq(table.id, id)
			}
		}
	});

	if (!key) {
		error(404, 'Key not found or does not belong to the user');
	}

	return key;
}

export async function S_upsertKey(key: KeyInterface, userID: string) {
	if (key.id) {
		// Check the key belongs to the user
		const userProviders = await db.query.providersTable.findFirst({
			where: (table, { eq, and }) => and(eq(table.id, key.providerID), eq(table.userID, userID)),
			columns: { id: true }
		});

		if (!userProviders) {
			error(403, 'Tried to update a key for a provider that does not belong to the user');
		}
	}

	console.log('key', key);

	const insertionResult = await db
		.insert(apiKeysTable)
		.values(undefineExtras(key))
		.onConflictDoUpdate({
			target: [apiKeysTable.id],
			set: {
				id: sql`excluded.id`,
				providerID: sql`excluded.provider`,
				label: sql`excluded.label`,
				key: sql`excluded.key`
			}
		})
		.returning();

	if (!insertionResult) {
		error(500, 'Failed to update key');
	}

	return insertionResult;
}

export async function S_deleteKey(id: string, userID: string) {
	const userProviders = await db.query.providersTable.findMany({
		where: (table, { eq }) => eq(table.userID, userID),
		columns: {},
		with: {
			apiKeys: {
				columns: { id: true }
			}
		}
	});

	if (!userProviders) {
		error(403, 'Tried to delete a key, but the user has no providers');
	}

	// Check the key belongs to the user and delete it.

	if (userProviders.some((provider) => provider.apiKeys?.some((key) => key.id === id))) {
		const res = await db.delete(apiKeysTable).where(eq(apiKeysTable.id, id)).returning({ id: apiKeysTable.id });
		if (!res) {
			error(500, 'Failed to delete key');
		}
	}
}

export async function S_getProviders(userID: string, withKeys: boolean, withModels: boolean) {
	const providers = await db.query.providersTable.findMany({
		where: (table, { eq }) => eq(table.userID, userID),
		with: {
			...(withKeys && { apiKeys: true }),
			...(withModels && { models: true })
		}
	});

	return providers;
}

export async function S_getProvider(id: string, userID: string) {
	const provider = await db.query.providersTable.findFirst({
		where: (table, { eq, and }) => and(eq(table.id, id), eq(table.userID, userID))
	});

	if (!provider) {
		error(404, 'Provider not found or does not belong to the user');
	}

	return provider;
}

export async function S_deleteProvider(id: string, userID: string) {
	const res = await db
		.delete(providersTable)
		.where(and(eq(providersTable.id, id), eq(providersTable.userID, userID)))
		.returning({ id: providersTable.id });
	if (!res) {
		error(500, 'Failed to delete provider');
	}
}

export async function S_upsertsProvider(provider: ProviderInterface, userID: string) {
	const updatedProvider = await db.transaction(async (tx) => {
		if (provider.id) {
			// Check the provider belongs to the user
			const userProviders = await tx.query.providersTable.findFirst({
				where: (table, { eq, and }) => and(eq(table.id, provider.id!), eq(table.userID, userID)),
				columns: { id: true }
			});

			if (!userProviders) {
				error(403, 'Tried to update a provider that does not belong to the user');
			}
		} else {
			provider.userID = userID;
		}

		const insertionResult = await tx
			.insert(providersTable)
			// @ts-expect-error provider.userID is not undefined here.
			.values(undefineExtras(provider))
			.onConflictDoUpdate({
				target: [providersTable.id],
				set: {
					id: sql`excluded.id`,
					name: sql`excluded.name`,
					type: sql`excluded.type`,
					baseURL: sql`excluded.base_url`,
					userID: sql`excluded.user_id`
				}
			})
			.returning();

		if (!insertionResult) {
			error(500, 'Failed to update provider');
		}

		return insertionResult;
	});

	return updatedProvider;
}

export async function S_getAssistants(userID: string) {
	const assistants = await db.query.assistantsTable.findMany({
		where: (table, { eq }) => eq(table.userID, userID)
	});

	return assistants;
}

export async function S_getAssistant(id: string, userID: string) {
	const assistant = await db.query.assistantsTable.findFirst({
		where: (table, { eq, and }) => and(eq(table.id, id), eq(table.userID, userID))
	});

	if (!assistant) {
		error(404, 'Assistant not found or does not belong to the user');
	}

	return assistant;
}

export async function S_upsertsAssistant(assistant: AssistantInterface, userID: string) {
	const updatedAssistant = await db.transaction(async (tx) => {
		if (assistant.id) {
			// Check the assistant belongs to the user
			const userAssistants = await tx.query.assistantsTable.findFirst({
				where: (table, { eq, and }) => and(eq(table.id, assistant.id!), eq(table.userID, userID)),
				columns: { id: true }
			});

			if (!userAssistants) {
				error(403, 'Tried to update an assistant that does not belong to the user');
			}
		}

		const insertionResult = await tx
			.insert(assistantsTable)
			.values(undefineExtras(assistant))
			.onConflictDoUpdate({
				target: [assistantsTable.id],
				set: {
					model: sql`excluded.model`,
					apiKey: sql`excluded.api_key`,
					name: sql`excluded.name`,
					about: sql`excluded.about`,
					aboutUser: sql`excluded.about_user`,
					aboutUserFromUser: sql`excluded.about_user_from_user`,
					assistantInstructions: sql`excluded.assistant_instructions`,
					assistantInstructionsFromUser: sql`excluded.assistant_instructions_from_user`,
					systemPrompt: sql`excluded.system_prompt`,
					images: sql`excluded.images`,
					audio: sql`excluded.audio`,
					video: sql`excluded.video`,
					prefill: sql`excluded.prefill`
				}
			})
			.returning();

		if (!insertionResult) {
			error(500, 'Failed to update assistant');
		}

		return insertionResult;
	});

	return updatedAssistant;
}
