// import { db } from '$lib/db';
// import { error } from '@sveltejs/kit';

// export const load = async ({ locals: { user } }) => {
// 	if (!user) {
// 		error(401, 'Unauthorized');
// 	}

// 	const conversations = await db.query.conversationsTable.findMany({
// 		where: (table, { eq }) => eq(table.userID, user.id),
// 		columns: {
// 			id: true,
// 			summary: true,
// 			like: true,
// 			assistant: true
// 		}
// 	});

// 	const assistants = await db.query.assistantsTable.findMany({
// 		where: (table, { eq }) => eq(table.userID, user.id),
// 		columns: {
// 			id: true,
// 			name: true
// 		}
// 	});

// 	return {
// 		conversations,
// 		assistants
// 	};
// };
