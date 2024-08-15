import { APIfetchUser } from '$lib/api';

export const ssr = false;
export const load = async () => {
	try {
		const dbUser = await APIfetchUser();
		return {
			dbUser
		};
	} catch {
		return {};
	}
};
