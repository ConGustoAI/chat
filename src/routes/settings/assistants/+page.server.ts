// import { db } from '$lib/db';
// import { error } from '@sveltejs/kit';

// export const load = async ({ locals: { user } }) => {
// 	if (!user) {
// 		error(401, 'Unauthorized');
// 	}

// 	const assistants = await db.query.assistantsTable.findMany({
// 		where: (table, { eq }) => eq(table.userID, user.id),
// 		columns: {
// 			id: true,
// 			userID: true,
// 			name: true,
// 			about: true,
// 			model: true,
// 			apiKey: true,
// 			aboutUser: true,
// 			aboutUserFromUser: true,
// 			assistantInstructions: true,
// 			assistantInstructionsFromUser: true,
// 			systemPrompt: true,
// 			images: true,
// 			prefill: true
// 		},
// 	});

// 	const userData = await db.query.usersTable.findFirst({
// 		where: (table, { eq }) => eq(table.id, user.id),
// 		columns: {
// 			id: true,
// 			aboutUser: true,
// 			assistantInstructions: true
// 		}
// 	});
// 	if (!userData) {
// 		error(404, 'User not found');
// 	}

// 	const providers = await db.query.providersTable.findMany({
// 		where: (table, { eq }) => eq(table.userID, user.id),
// 		columns: {
// 			id: true,
// 			name: true,
// 			type: true
// 		},
// 		with: {
// 			models: {
// 				columns: {
// 					id: true,
// 					name: true,
// 					display_name: true,
// 					images: true,
// 					prefill: true,
// 					inputContext: true,
// 					providerID: true
// 				}
// 			},
// 			apiKeys: {
// 				columns: {
// 					id: true,
// 					label: true
// 				}
// 			}
// 		}
// 	});

// 	return { assistants, userData, providers };
// };
