/**
 * useChat hook — manages sending messages and streaming responses.
 * Connects the AI service to the Zustand store.
 */
import { useCallback, useRef } from 'react';
import useChatStore from '../store/chatStore';
import { streamMessage } from '../lib/aiService';

export function useChat() {
    const abortRef = useRef(null);

    const addMessage = useChatStore((s) => s.addMessage);
    const appendToLastMessage = useChatStore((s) => s.appendToLastMessage);
    const replaceLastMessage = useChatStore((s) => s.replaceLastMessage);
    const setStreaming = useChatStore((s) => s.setStreaming);
    const selectedModel = useChatStore((s) => s.selectedModel);
    const getActiveChat = useChatStore((s) => s.getActiveChat);
    const clearFiles = useChatStore((s) => s.clearFiles);

    const send = useCallback(
        async (content, attachedFiles = []) => {
            if (!content.trim() && attachedFiles.length === 0) return;

            // Build the full prompt with attached files
            let fullPrompt = content;
            if (attachedFiles.length > 0) {
                const fileContents = attachedFiles
                    .map((f) => `--- File: ${f.name} ---\n${f.content}`)
                    .join('\n\n');
                fullPrompt = `${fileContents}\n\n${content}`;
            }

            // Add user message to store
            addMessage('user', content, attachedFiles);
            clearFiles();

            // Prepare assistant placeholder (empty for now)
            addMessage('assistant', '');
            setStreaming(true);

            // Get conversation history
            // We need to exclude the placeholder assistant message AND the user message we just added,
            // because streamMessage() will append the user message (prompt) itself.
            const chat = getActiveChat();
            const history = chat.messages
                .slice(0, -2) // Remove assistant placeholder AND current user message
                .map((m) => ({ role: m.role, content: m.content }));

            // Abort controller for stopping generation
            const controller = new AbortController();
            abortRef.current = controller;

            try {
                const stream = streamMessage(fullPrompt, {
                    model: selectedModel,
                    history: history.slice(-20), // Keep last 20 messages for context
                    signal: controller.signal,
                });

                for await (const token of stream) {
                    if (controller.signal.aborted) break;
                    appendToLastMessage(token);
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    // If pure error, show it
                    appendToLastMessage(
                        '\n\n> ⚠️ **Error:** ' + (err.message || 'Failed to get response. Please try again.')
                    );
                }
            } finally {
                setStreaming(false);
                abortRef.current = null;
            }
        },
        [addMessage, appendToLastMessage, setStreaming, selectedModel, getActiveChat, clearFiles]
    );

    const stop = useCallback(() => {
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }
        setStreaming(false);
    }, [setStreaming]);

    return { send, stop };
}
