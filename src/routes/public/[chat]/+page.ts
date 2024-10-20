import { APIfetchPublicConversation } from '$lib/api';
import { A } from '$lib/appstate.svelte.js';
import { mediaCreateThumbnail, mediaProcessResize, syncMedia } from '$lib/utils/media_utils.svelte.js';

// export const ssr = true;
// export const csr = false;

export const load = async ({ params}) => {
	try {
		A.conversation = await APIfetchPublicConversation(params.chat);

		if (!A.conversation.media) A.conversation.media = [];

		for (const m of A.conversation.media) {
			await syncMedia(m);
			await Promise.all([mediaCreateThumbnail(m), mediaProcessResize(m)]);
		}

		A.conversation.messages?.map((m) => {
			m.markdownCache = undefined;
			if (m.mediaIDs?.length) {
				m.media = [];
				for (const mediaID of m.mediaIDs) {
					const media = A.conversation?.media?.find((m) => m.id === mediaID);
					if (media) {
						m.media.push(media);
					}
				}
			}
		});
	} catch {
		return {};
	}
};
