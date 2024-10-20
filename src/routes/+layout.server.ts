export const ssr = false;

// This makes the `dbUser` and `assistants` available to all pages.
export const load = async ({ locals: { dbUser } }) => {
	return { dbUser};
};
