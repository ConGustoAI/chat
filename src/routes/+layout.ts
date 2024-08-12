import { fetchUser } from '$lib/api/user.js';
// import { redirect } from '@sveltejs/kit';

export const ssr = false;

export const load = async ({ data }) => {
	console.log('data', data);

	try {
		const dbUser = await fetchUser();
		return {
			dbUser
		};
	} catch {
		console.log('no user');
		// return redirect(303, '/login');
	}

	// } catch {
	// 	console.log('no user');
	// 	// return redirect(303, '/login');
	// }
};
