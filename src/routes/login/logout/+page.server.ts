import { deleteAllSessions, deleteSession } from '$lib/utils/auth';
import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

import dbg from 'debug';
const debug = dbg('app:logout');

export const actions: Actions = {
	logout: async ({ locals: { session } }) => {
		debug('signout');
		if (!session) {
			debug('no session');
			redirect(303, '/login');
		}
		await deleteSession(session.id);

		debug('signout done');
		redirect(303, '/login');
	},

	logoutAll: async ({ locals: { session } }) => {
		debug('signoutAll');
		if (!session) {
			debug('no user');
			redirect(303, '/login');
		}
		await deleteAllSessions(session.userID);

		debug('signoutAll done');
		redirect(303, '/login');
	}
};
