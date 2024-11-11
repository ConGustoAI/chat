// import { A } from '$lib/appstate.svelte.js';
// import dbg from 'debug';
// const debug = dbg('app:layout.server');


export const ssr = false;

export const load = ({ locals: { session } }) => {

	// debug('load A.user', $state.snapshot(A.user));

	// if (A.user?.id !== session?.userID) {
	// 	A.user = session?.user;
	// }



	return { session };
};
