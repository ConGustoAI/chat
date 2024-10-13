import { A } from '$lib/appstate.svelte';
import {goto} from '$app/navigation'
import dbg from 'debug'
import { defaultsUUID } from '$lib/db/schema';
import { readDataStream } from 'ai';
import { APIupsertConversation, APIupsertMessage } from '$lib/api';
const debug = dbg("app:lib:utils:chat")

export let abortController: AbortController | undefined = undefined;

export async function submitConversation(toDelete?: string[]) {
    debug('submitConversation', A.conversation, toDelete);

    if (!A.dbUser) {
        debug('submitConversation', 'not logged in, redirecting to login');
        await goto('/login');
    }

    A.chatStreaming = true;

    try {
        if (!A.conversation) throw new Error('The conversation is missing.');
        if (!A.conversation.assistant) throw new Error('No assistant assigned.');
        if (!A.conversation.messages) throw new Error('The conversation messages are missing.');

        if (A.dbUser?.assistant === defaultsUUID && A.dbUser.lastAssistant !== A.conversation.assistant) {
            // The database will be updated on the back-end.
            A.dbUser.lastAssistant = A.conversation.assistant;
        }

        const toSend = A.conversation.messages;

        if (toSend.length < 2) throw new Error('The conversation should have at least 2 messages.');
        if (toSend[toSend.length - 2].role !== 'user') throw new Error('The first message should be from the user.');
        if (toSend[toSend.length - 1].role !== 'assistant') {
            throw new Error('The last message should be from the assistant.');
        }

        abortController = new AbortController();

        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ conversation: A.conversation, toDelete }),
            signal: abortController.signal
        });
        debug('submitConversation POST: ', res);

        if (!res.ok) throw new Error((await res.json()).message ?? 'Failed to submit the conversation.');
        if (!res.body) throw new Error('The response body is empty.');

        const reader = res.body.getReader();
        let timestamp = Date.now();

        for await (const { type, value } of readDataStream(reader)) {
            debug('readDataStream', type, value);
            if (!A.conversation.messages) throw new Error('The conversation messages are missing??');
            if (type === 'text') {
                A.conversation.messages[A.conversation.messages.length - 1].text += value;
                if (Date.now() - timestamp > 100) {
                    timestamp = Date.now();
                    A.conversation.messages[A.conversation.messages.length - 1].markdownCache = undefined;
                }
            }
            if (type === 'finish_message') {
                debug("finish message received")
            }
            if (type === 'data') {
                // debug('readDataStream', { type, value });

                for (const dataPart of value) {
                    if (typeof dataPart === 'object' && dataPart !== null) {
                        if ('conversation' in dataPart) {
                            const dataConversation = dataPart.conversation as unknown as ConversationInterface;
                            if (A.conversation.id && A.conversation.id != dataConversation.id)
                                throw new Error('The conversation ID does not match.');

                            Object.assign(A.conversation, dataConversation);
                            if (!A.conversation.id) throw new Error('The conversation ID is missing.');

                            if (!A.conversations[A.conversation.id]) {
                                // New conversation is not yet in the conversations dictionary.
                                A.conversations[A.conversation.id] = A.conversation;
                                A.conversationOrder.unshift(A.conversation.id!);
                            }
                        }
                        if ('userMessage' in dataPart) {
                            if (!A.conversation.messages?.length) throw new Error('The conversation messages are missing??');
                            // TS is being silly a bit
                            A.conversation.messages[A.conversation.messages.length - 2] =
                                dataPart.userMessage as unknown as MessageInterface;
                        }
                        if ('assistantMessage' in dataPart) {
                            if (!A.conversation.messages?.length) throw new Error('The conversation messages are missing??');
                            // TS is being silly a bit
                            A.conversation.messages[A.conversation.messages.length - 1] =
                                dataPart.assistantMessage as unknown as MessageInterface;
                        }
                    }
                }
            }
            if (type === 'error') {
                debug('readDataStream error', value);
                // throw new Error(value);
            }
        }
        if (!A.conversation?.messages?.length) throw new Error('The conversation messages are missing??');
        A.conversation.messages[A.conversation.messages.length - 1].markdownCache = undefined;
    } catch (e) {
        if (e instanceof Error) {
            const E = e as Error;
            if (E.name === 'AbortError') {
                // The conversation was aborted, and thus was not saved on the server side.
                // We need to save the conversation and the messages locally and update it in the database.
                debug('submitConversation', 'aborted');
                if (A.conversation && A.conversation.messages && A.conversation.messages?.length >= 2) {
                    const newConversation = await APIupsertConversation(A.conversation);

                    let userMessage = A.conversation.messages[A.conversation.messages.length - 2];

                    userMessage = {
                        ...userMessage,
                        conversationID: newConversation.id
                    };

                    A.conversation.messages[A.conversation.messages.length - 2] = await APIupsertMessage(userMessage);

                    let assistantMessage = A.conversation.messages[A.conversation.messages.length - 1];

                    assistantMessage = {
                        ...assistantMessage,
                        finishReason: 'aborted',
                        assistantID: A.conversation.assistant,
                        assistantName: A.assistants[A.conversation.assistant ?? 'unknown']?.name ?? 'Unknown',
                        model: A.assistants[A.conversation.assistant ?? 'unknown']?.model ?? 'Unknown',
                        modelName:
                            A.models[A.assistants[A.conversation.assistant ?? 'unknown']?.model ?? 'unknown']?.name ?? 'Unknown',
                        temperature: A.assistants[A.conversation.assistant ?? 'unknown']?.temperature ?? 0,
                        topP: A.assistants[A.conversation.assistant ?? 'unknown']?.topP ?? 0,
                        topK: A.assistants[A.conversation.assistant ?? 'unknown']?.topK ?? 0,
                        conversationID: newConversation.id
                    };

                    A.conversation.messages[A.conversation.messages.length - 1] = await APIupsertMessage(assistantMessage);

                    A.conversation = { ...A.conversation, ...newConversation };
                    if (!A.conversation.id) throw new Error('The conversation ID is missing.');

                    if (!A.conversations[A.conversation.id]) {
                        A.conversations[A.conversation.id] = A.conversation;
                        A.conversationOrder = [A.conversation.id!, ...A.conversationOrder];
                    }
                }
            } else {
                throw e;
            }
        }
    } finally {
        // This will also trigger the conversation summary.
        A.chatStreaming = false;
        abortController = undefined;
    }
}
