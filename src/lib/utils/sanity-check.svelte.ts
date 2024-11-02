
import dbg from 'debug';
const debug = dbg('app:utils:sanity-check');

export function sanityCheckConversationMedia(conversation: ConversationInterface) {

    for(const message of conversation.messages ?? []) {
        for(const media of message.media ?? []) {
            if(media.type === 'image') {
                if(!media.originalWidth || !media.originalHeight) {
                    debug('Missing width or height for image media', $state.snapshot(media));
                }
            }

            if(!conversation.media) debug('Missing media object in conversation with messages with media', $state.snapshot(conversation));

            if(media.id && !message.mediaIDs?.includes(media.id)) {
                debug('Media ID not found in message mediaIDs', $state.snapshot(media));
            }
        }

        for(const mediaID of message.mediaIDs ?? []) {
            if(!conversation.media?.find(media => media.id === mediaID)) {
                debug('Media ID not found in conversation media', $state.snapshot(mediaID), $state.snapshot(conversation.media));
            }
        }
    }
}