import { mediaTable } from '$lib/db/schema';
import dbg from 'debug';

const debug = dbg('app:lib:api:media');

export async function APIfetchAllMedia(withURL: boolean = false) {
    debug(`fetchMedia${withURL ? 'WithURL' : ''}`);
    const res = await fetch(`/api/media${withURL ? '?url=true' : ''}`);

    if (!res.ok) throw new Error(`Failed to fetch media${withURL ? ' with URL' : ''}: ${await res.text()}`);
    const data = (await res.json()) as MediaInterface[];
    debug(`fetchMedia${withURL ? 'WithURL' : ''} -> %o`, data);
    return data;
}

export async function APIupsertMedia(media: MediaInterface) {
    debug('upsertMedia %o', media);
    const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(MediaInterfaceFilter(media))
    });

    if (!res.ok) throw new Error(`Failed to upsert media: ${await res.text()}`);
    const data = (await res.json()) as MediaInterface;
    debug('upsertMedia -> %o', data);
    return data;
}

export async function APIfetchMedia(id: string, withURL: boolean = false) {
    debug('fetchMedia %o', id);
    const res = await fetch(`/api/media/${id}${withURL ? '?url=true' : ''}`);

    if (!res.ok) throw new Error(`Failed to fetch media by ID: ${await res.text()}`);
    const data = (await res.json()) as MediaInterface;
    debug('fetchMedia -> %o', data);
    return data;
}

export async function APIdeleteMedia(id: string) {
    debug('deleteMedia %o', id);
    const res = await fetch(`/api/media/${id}`, {
        method: 'DELETE'
    });

    if (!res.ok) throw new Error(`Failed to delete media: ${await res.text()}`);
    const data = (await res.json()) as MediaInterface;
    debug('deleteMedia -> %o', data);
    return data;
}


export function MediaInterfaceFilter(media: MediaInterface) {
    const allowedKeys = Object.keys(mediaTable);

    const excludedKeys = ['updatedAt', 'createdAt'];

    const filteredMedia = Object.fromEntries(
        Object.entries(media).filter(([key]) => allowedKeys.includes(key) && !excludedKeys.includes(key))
    );

    return filteredMedia as MediaInterface;
}
