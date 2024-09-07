import { redirect } from '@sveltejs/kit';
import dbg from 'debug';
import type { Actions } from './$types';
import { lucia } from '$lib/db/auth';

const debug = dbg('app:logout');

export const actions: Actions = {
	logout: async ({ locals }) => {
		debug('signout');
		if (!locals.session) {
			debug('no session');
			redirect(303, '/login');
		}
 	 	await lucia.invalidateSession(locals.session.id);

		debug('signout done');
		redirect(303, '/login');
	},

	logoutAll: async ({ locals }) => {
		debug('signoutAll');
		if (!locals.user) {
			debug('no user');
			redirect(303, '/login');
		}
		await lucia.invalidateUserSessions(locals.user.id);

		debug('signoutAll done');
		redirect(303, '/login');
	}
};
