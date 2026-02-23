/**
 * Zustand store — default light theme, renamed to Hitler AI.
 */
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export const MODELS = [
    { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', description: 'Fast & efficient' },
    { id: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5', description: 'Balanced power' },
    { id: 'claude-opus-4-6', label: 'Claude Opus 4.6', description: 'Maximum capability' },
    { id: 'gpt-4o', label: 'GPT-4o', description: 'OpenAI flagship' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Small & fast' },
];

const createChat = (title = 'New Chat') => ({
    id: uuidv4(),
    title,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
});

const initialChat = createChat();

const useChatStore = create((set, get) => ({
    // ─── Theme (light by default) ───────────────────────────
    theme: 'light',
    toggleTheme: () =>
        set((s) => {
            const next = s.theme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            return { theme: next };
        }),

    // ─── Chats ──────────────────────────────────────────────
    chats: [initialChat],
    activeChatId: initialChat.id,

    getActiveChat: () => {
        const { chats, activeChatId } = get();
        return chats.find((c) => c.id === activeChatId) ?? chats[0];
    },

    newChat: () => {
        const chat = createChat();
        set((s) => ({
            chats: [chat, ...s.chats],
            activeChatId: chat.id,
            codeViewerContent: null,
        }));
    },

    setActiveChat: (id) => set({ activeChatId: id, codeViewerContent: null }),

    deleteChat: (id) =>
        set((s) => {
            const remaining = s.chats.filter((c) => c.id !== id);
            if (remaining.length === 0) {
                const fresh = createChat();
                return { chats: [fresh], activeChatId: fresh.id };
            }
            return {
                chats: remaining,
                activeChatId: s.activeChatId === id ? remaining[0].id : s.activeChatId,
            };
        }),

    renameChat: (id, title) =>
        set((s) => ({
            chats: s.chats.map((c) => (c.id === id ? { ...c, title } : c)),
        })),

    // ─── Messages ───────────────────────────────────────────
    addMessage: (role, content, files = []) =>
        set((s) => {
            const msg = {
                id: uuidv4(),
                role,
                content,
                reasoning: '',
                duration: null,
                error: null,
                files,
                timestamp: Date.now(),
            };
            return {
                chats: s.chats.map((c) =>
                    c.id === s.activeChatId
                        ? {
                            ...c,
                            messages: [...c.messages, msg],
                            updatedAt: Date.now(),
                            title:
                                c.messages.length === 0 && role === 'user'
                                    ? content.slice(0, 50) + (content.length > 50 ? '…' : '')
                                    : c.title,
                        }
                        : c
                ),
            };
        }),

    appendToLastMessage: (token) =>
        set((s) => ({
            chats: s.chats.map((c) => {
                if (c.id !== s.activeChatId) return c;
                const msgs = [...c.messages];
                const last = msgs[msgs.length - 1];
                if (last?.role === 'assistant') {
                    msgs[msgs.length - 1] = { ...last, content: last.content + token };
                }
                return { ...c, messages: msgs, updatedAt: Date.now() };
            }),
        })),

    appendReasoningToLastMessage: (token) =>
        set((s) => ({
            chats: s.chats.map((c) => {
                if (c.id !== s.activeChatId) return c;
                const msgs = [...c.messages];
                const last = msgs[msgs.length - 1];
                if (last?.role === 'assistant') {
                    msgs[msgs.length - 1] = {
                        ...last,
                        reasoning: (last.reasoning || '') + token
                    };
                }
                return { ...c, messages: msgs, updatedAt: Date.now() };
            }),
        })),

    replaceLastMessage: (content) =>
        set((s) => ({
            chats: s.chats.map((c) => {
                if (c.id !== s.activeChatId) return c;
                const msgs = [...c.messages];
                const last = msgs[msgs.length - 1];
                if (last?.role === 'assistant') {
                    msgs[msgs.length - 1] = { ...last, content };
                }
                return { ...c, messages: msgs, updatedAt: Date.now() };
            }),
        })),

    setErrorOnLastMessage: (error) =>
        set((s) => ({
            chats: s.chats.map((c) => {
                if (c.id !== s.activeChatId) return c;
                const msgs = [...c.messages];
                const last = msgs[msgs.length - 1];
                if (last?.role === 'assistant') {
                    msgs[msgs.length - 1] = { ...last, error };
                }
                return { ...c, messages: msgs, updatedAt: Date.now() };
            }),
        })),

    setDurationOnLastMessage: (duration) =>
        set((s) => ({
            chats: s.chats.map((c) => {
                if (c.id !== s.activeChatId) return c;
                const msgs = [...c.messages];
                const last = msgs[msgs.length - 1];
                if (last?.role === 'assistant') {
                    msgs[msgs.length - 1] = { ...last, duration };
                }
                return { ...c, messages: msgs, updatedAt: Date.now() };
            }),
        })),

    // ─── Streaming ──────────────────────────────────────────
    isStreaming: false,
    setStreaming: (v) => set({ isStreaming: v }),
    abortController: null,
    setAbortController: (ctrl) => set({ abortController: ctrl }),

    // ─── Model ─────────────────────────────────────────────
    selectedModel: MODELS[0].id,
    setSelectedModel: (id) => set({ selectedModel: id }),

    // ─── UI ────────────────────────────────────────────────
    sidebarOpen: true,
    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

    rightPanelOpen: false,
    toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),

    codeViewerContent: null,
    openCodeViewer: (payload) => set({ codeViewerContent: payload, rightPanelOpen: true }),
    closeCodeViewer: () => set({ codeViewerContent: null }),

    pasteCodeMode: false,
    togglePasteCodeMode: () => set((s) => ({ pasteCodeMode: !s.pasteCodeMode })),

    attachedFiles: [],
    addFiles: (files) => set((s) => ({ attachedFiles: [...s.attachedFiles, ...files] })),
    removeFile: (idx) => set((s) => ({ attachedFiles: s.attachedFiles.filter((_, i) => i !== idx) })),
    clearFiles: () => set({ attachedFiles: [] }),

    searchQuery: '',
    setSearchQuery: (q) => set({ searchQuery: q }),

    showThinking: true,
    toggleShowThinking: () => set((s) => ({ showThinking: !s.showThinking })),
}));

export default useChatStore;
