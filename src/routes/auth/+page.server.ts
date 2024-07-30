import { redirect, error } from '@sveltejs/kit';
import { db } from '$lib/db';
import type { Actions } from './$types';
import { usersTable } from '$lib/db/schema';

export const actions: Actions = {
	signup: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		const { error: err } = await supabase.auth.signUp({ email, password });
		if (err) {
			console.error(err);
			redirect(303, '/auth/error');
		} else {
			redirect(303, '/');
		}
	},

	login: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		const {
			data: { user },
			error: err
		} = await supabase.auth.signInWithPassword({ email, password });
		if (err) {
			console.error(err);
			redirect(303, '/auth/error');
		} else {
			if (!user) {
				error(500, 'Got no user back from Supabase, despite no error');
			}
			await db.insert(usersTable).values({ id: user.id, email: user.email }).onConflictDoNothing();
			redirect(303, '/');
		}
	},

	logout: async ({ locals: { supabase } }) => {
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error(error);
		}
		redirect(303, '/');
	}
};
