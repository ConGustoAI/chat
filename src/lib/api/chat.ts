export async function chatRequest(conversatoin: ConversationInterface) {
    let res;
    res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(conversatoin)
    });

    if (!res.ok) throw new Error('Failed to update chat: ' + (await res.json()).message);
    return await res.json();
}