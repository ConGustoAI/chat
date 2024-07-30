// import { apiProvidersTable, } from '$lib/db/schema';
// import { eq } from 'drizzle-orm';
import { db } from '$lib/db';
import { providersTable } from '$lib/db/schema';

export const load = async ({ locals: { user } }) => {
	if (!user) {
		return {
			providers: []
		};
	}
	const providers = await db.query.providersTable.findMany({
		where: (table, { eq }) => eq(table.userID, user.id),
		columns: {
			id: true,
			name: true,
			type: true,
			baseURL: true
		},
		with: {
			apiKeys: {
				columns: {
					id: true,
					providerID: true,
					key: true,
					label: true
				}
			}
		},
		orderBy: providersTable.name
	});

	return { providers };
};
