import { redirect } from '@sveltejs/kit';
import { fetchUser } from '$lib/api';

export const ssr = false;
export const load = async () => {
	try {
		const dbUser = await fetchUser();
		return {
			dbUser
		};
	} catch {
		return redirect(303, '/login');
	}
};
