import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import dbg from 'debug';

const debug = dbg('app:api:logout');

export const POST: RequestHandler = async ({ locals: { supabase } }) => {
	const { error } = await supabase.auth.signOut();
	if (error) {
		debug('Error during logout:', error);
		return new Response(JSON.stringify({ success: false, error: 'Logout failed' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	throw redirect(303, '/login');
};
