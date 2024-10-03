import dbg from 'debug';

const debug = dbg('app:lib:api:file');

export async function APIfetchFile(id: string) {
    debug('fetchFile %o', id);
    const res = await fetch(`/api/file/${id}`);

    if (!res.ok) throw new Error(`Failed to fetch file: ${await res.text()}`);
    const data = (await res.json()) as FileInterface;
    debug('fetchFile -> %o', data);
    return data;
}

export async function APIupsertFile(file: FileInterface, uploadUrl: boolean = false) {
    debug('upsertFile %o', file);
    const res = await fetch(`/api/file?uploadurl=${!!uploadUrl}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(file)
    });

    if (!res.ok) throw new Error(`Failed to upsert file: ${await res.text()}`);
    const data = (await res.json()) as FileInterface;
    debug('upsertFile -> %o', data);
    return data;
}

export async function APIdeleteFile(id: string) {
    debug('deleteFile %o', id);
    const res = await fetch(`/api/file/${id}`, {
        method: 'DELETE'
    });

    if (!res.ok) throw new Error(`Failed to delete file: ${await res.text()}`);
    const data = (await res.json()) as FileInterface;
    debug('deleteFile -> %o', data);
    return data;
}
