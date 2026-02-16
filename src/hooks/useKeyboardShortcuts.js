/**
 * useKeyboardShortcuts — Global keyboard shortcuts for the app.
 * 
 * Bindings:
 *  Ctrl+K        → New chat
 *  Ctrl+Shift+C  → Copy last code block
 *  Ctrl+B        → Toggle sidebar
 */
import { useEffect } from 'react';
import useChatStore from '../store/chatStore';

export function useKeyboardShortcuts() {
    const newChat = useChatStore((s) => s.newChat);
    const toggleSidebar = useChatStore((s) => s.toggleSidebar);
    const getActiveChat = useChatStore((s) => s.getActiveChat);

    useEffect(() => {
        const handler = (e) => {
            const isCtrl = e.ctrlKey || e.metaKey;

            // Ctrl+K → New chat
            if (isCtrl && e.key === 'k') {
                e.preventDefault();
                newChat();
            }

            // Ctrl+B → Toggle sidebar
            if (isCtrl && e.key === 'b') {
                e.preventDefault();
                toggleSidebar();
            }

            // Ctrl+Shift+C → Copy last code block from assistant
            if (isCtrl && e.shiftKey && e.key === 'C') {
                e.preventDefault();
                const chat = getActiveChat();
                const lastAssistant = [...chat.messages]
                    .reverse()
                    .find((m) => m.role === 'assistant');
                if (lastAssistant) {
                    // Extract code blocks from markdown
                    const codeBlockRegex = /```[\s\S]*?\n([\s\S]*?)```/g;
                    const matches = [...lastAssistant.content.matchAll(codeBlockRegex)];
                    if (matches.length > 0) {
                        const lastCode = matches[matches.length - 1][1].trim();
                        navigator.clipboard.writeText(lastCode);
                    }
                }
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [newChat, toggleSidebar, getActiveChat]);
}
