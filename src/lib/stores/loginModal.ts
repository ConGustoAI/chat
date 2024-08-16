import { writable } from 'svelte/store';
import { goto } from '$app/navigation';
import { get } from 'svelte/store';

export const loginModal = writable();

export async function toLogin() {
	// debug('no user');
	if (get(loginModal)) {
		(get(loginModal) as HTMLDialogElement).showModal();
	} else {
		// debug('no login modal');
		await goto('/login');
	}
}
