import { db } from '$lib/db';

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
		},
		with: {
			models: {
                columns: {
                    id: true,
                    name: true,
                    display_name: true,
                    images: true,
                    prefill: true,
                    inputContext: true,
                    providerID: true
                }
            },
		}
    });

	return { providers };
};
