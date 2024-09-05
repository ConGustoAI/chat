import { redirect } from '@sveltejs/kit';
import dbg from 'debug';
import type { Actions } from './$types';

const debug = dbg('app:logout');

export const actions: Actions = {
	logout: async ({ locals }) => {
		debug('signout');
		const { error } = await locals.supabase.auth.signOut({ scope: 'local' });
		if (error) debug(error);

		// locals.supabase.auth.signOut();
		debug('signout done');
		redirect(303, '/login');
	},

	logoutAll: async ({ locals }) => {
		debug('signoutAll');
		const { error } = await locals.supabase.auth.signOut({ scope: 'global' });
		if (error) debug(error);
		debug('signoutAll done');
		redirect(303, '/login');
	}
};
