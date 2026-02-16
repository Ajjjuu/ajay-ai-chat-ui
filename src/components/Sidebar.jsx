/**
 * Sidebar — Left panel with branding, settings, chat history, search, theme toggle.
 * Settings (shortcuts, capabilities, tips) are integrated here.
 * Model selector moved to InputBox.
 */
import { memo, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Trash2, MessageSquare, PanelLeftClose,
    Pencil, Check, X, Sparkles, Sun, Moon, ChevronDown,
    Keyboard, Lightbulb, Info
} from 'lucide-react';
import useChatStore from '../store/chatStore';

const ChatItem = memo(function ChatItem({ chat, isActive, onSelect, onDelete, onRename }) {
    const [editing, setEditing] = useState(false);
    const [editTitle, setEditTitle] = useState('');

    const handleStartEdit = useCallback((e) => {
        e.stopPropagation();
        setEditTitle(chat.title);
        setEditing(true);
    }, [chat.title]);

    const handleSaveEdit = useCallback(() => {
        if (editTitle.trim()) onRename(chat.id, editTitle.trim());
        setEditing(false);
    }, [editTitle, chat.id, onRename]);

    const timeAgo = useMemo(() => {
        const diff = Date.now() - chat.updatedAt;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Now';
        if (mins < 60) return `${mins}m`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h`;
        return `${Math.floor(hrs / 24)}d`;
    }, [chat.updatedAt]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className={`group flex items-center gap-2.5 px-3 py-2 rounded-sm cursor-pointer
                  transition-all duration-200 ${isActive
                    ? 'glass-subtle gradient-border'
                    : 'hover:bg-[hsl(var(--bg-glass-hover)/0.4)] border border-transparent'
                }`}
            onClick={() => onSelect(chat.id)}
        >
            <div className={`w-6 h-6 rounded-sm flex items-center justify-center shrink-0 ${isActive ? 'bg-[var(--accent-1)]/15' : 'bg-transparent'
                }`}>
                <MessageSquare size={12} className={isActive ? 'text-[var(--accent-1)]' : 'text-[var(--text-3)]'} />
            </div>

            {editing ? (
                <div className="flex-1 flex items-center gap-1 min-w-0">
                    <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') setEditing(false);
                        }}
                        className="flex-1 min-w-0 bg-[hsl(var(--bg-input))] border border-[var(--glass-border-hover)]
                       rounded-sm px-2 py-0.5 text-[11px] text-[var(--text-1)] outline-none
                       focus:border-[var(--accent-1)]"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
                        className="p-0.5 text-[var(--success)]"><Check size={11} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setEditing(false); }}
                        className="p-0.5 text-[var(--text-3)]"><X size={11} /></button>
                </div>
            ) : (
                <>
                    <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium truncate text-[var(--text-1)]">{chat.title}</div>
                        <div className="text-[9px] text-[var(--text-3)] mt-0.5 flex items-center gap-1">
                            <span>{chat.messages.length} msg{chat.messages.length !== 1 ? 's' : ''}</span>
                            <span>·</span>
                            <span>{timeAgo}</span>
                        </div>
                    </div>
                    <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                        <button onClick={handleStartEdit}
                            className="p-1 rounded-sm hover:bg-[hsl(var(--bg-glass-active))] text-[var(--text-3)]
                         hover:text-[var(--text-2)] transition-colors">
                            <Pencil size={10} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(chat.id); }}
                            className="p-1 rounded-sm hover:bg-[var(--error)]/10 text-[var(--text-3)]
                         hover:text-[var(--error)] transition-colors">
                            <Trash2 size={10} />
                        </button>
                    </div>
                </>
            )}
        </motion.div>
    );
});

const Sidebar = memo(function Sidebar() {
    const chats = useChatStore((s) => s.chats);
    const activeChatId = useChatStore((s) => s.activeChatId);
    const newChat = useChatStore((s) => s.newChat);
    const setActiveChat = useChatStore((s) => s.setActiveChat);
    const deleteChat = useChatStore((s) => s.deleteChat);
    const renameChat = useChatStore((s) => s.renameChat);
    const sidebarOpen = useChatStore((s) => s.sidebarOpen);
    const toggleSidebar = useChatStore((s) => s.toggleSidebar);
    const searchQuery = useChatStore((s) => s.searchQuery);
    const setSearchQuery = useChatStore((s) => s.setSearchQuery);
    const theme = useChatStore((s) => s.theme);
    const toggleTheme = useChatStore((s) => s.toggleTheme);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const filteredChats = useMemo(() => {
        if (!searchQuery.trim()) return chats;
        const q = searchQuery.toLowerCase();
        return chats.filter(
            (c) => c.title.toLowerCase().includes(q) ||
                c.messages.some((m) => m.content.toLowerCase().includes(q))
        );
    }, [chats, searchQuery]);

    if (!sidebarOpen) return null;

    return (
        <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="h-full flex flex-col overflow-hidden shrink-0 transition-theme"
            style={{
                width: 260,
                background: 'var(--sidebar-bg)',
                backdropFilter: 'blur(24px) saturate(1.3)',
                WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
                borderRight: '1px solid var(--glass-border)',
            }}
        >
            {/* Header */}
            <div className="shrink-0 px-4 pt-4 pb-3">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-sm flex items-center justify-center glow-accent"
                            style={{ background: 'var(--gradient-main)' }}>
                            <Sparkles size={13} className="text-white" />
                        </div>
                        <span className="text-[13px] font-bold gradient-text">Hitler AI</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={toggleTheme}
                            className="p-1.5 rounded-sm text-[var(--text-3)] hover:text-[var(--text-2)]
                         hover:bg-[hsl(var(--bg-glass-hover)/0.5)] transition-all duration-200"
                            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                        >
                            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                        </button>
                        <button
                            onClick={toggleSidebar}
                            className="p-1.5 rounded-sm text-[var(--text-3)] hover:text-[var(--text-2)]
                         hover:bg-[hsl(var(--bg-glass-hover)/0.5)] transition-all duration-200"
                            title="Close sidebar"
                        >
                            <PanelLeftClose size={13} />
                        </button>
                    </div>
                </div>

                {/* New Chat */}
                <button
                    onClick={newChat}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[11px] font-semibold
                     text-white rounded-sm transition-all duration-200 glow-accent"
                    style={{ background: 'var(--gradient-main)' }}
                >
                    <Plus size={13} strokeWidth={2.5} />
                    New Chat
                </button>
            </div>

            {/* Search */}
            <div className="px-4 pb-2">
                <div className="relative">
                    <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search chats…"
                        className="w-full pl-7 pr-3 py-1.5 text-[10px] bg-[hsl(var(--bg-input))]
                       border border-[var(--glass-border)] rounded-sm text-[var(--text-1)]
                       placeholder:text-[var(--text-4)] outline-none
                       focus:border-[var(--accent-1)]/40 focus:shadow-[0_0_0_3px_var(--input-ring)]
                       transition-all duration-200"
                    />
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
                <AnimatePresence mode="popLayout">
                    {filteredChats.map((chat) => (
                        <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={chat.id === activeChatId}
                            onSelect={setActiveChat}
                            onDelete={deleteChat}
                            onRename={renameChat}
                        />
                    ))}
                </AnimatePresence>
                {filteredChats.length === 0 && (
                    <div className="text-center py-8 text-[10px] text-[var(--text-4)]">
                        {searchQuery ? 'No matching chats' : 'No chats yet'}
                    </div>
                )}
            </div>

            {/* Settings Section (collapsible) */}
            <div style={{ borderTop: '1px solid var(--glass-border)' }}>
                <button
                    onClick={() => setSettingsOpen(v => !v)}
                    className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-semibold
                     transition-colors hover:bg-[hsl(var(--bg-glass-hover)/0.4)]"
                    style={{ color: 'var(--text-2)' }}
                >
                    <div className="flex items-center gap-1.5">
                        <Info size={11} />
                        Settings & Help
                    </div>
                    <ChevronDown size={11} className={`transition-transform duration-200 ${settingsOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                    {settingsOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                        >
                            <div className="px-4 pb-3 space-y-4">
                                {/* Shortcuts */}
                                <div>
                                    <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider mb-1.5"
                                        style={{ color: 'var(--text-2)' }}>
                                        <Keyboard size={9} /> Shortcuts
                                    </div>
                                    <div className="space-y-1">
                                        {[
                                            ['Enter', 'Send message'],
                                            ['Shift + Enter', 'New line'],
                                            ['Ctrl + K', 'New chat'],
                                            ['Ctrl + B', 'Toggle sidebar'],
                                            ['Ctrl + Shift + C', 'Copy last code'],
                                        ].map(([keys, desc], i) => (
                                            <div key={i} className="flex items-center justify-between text-[9px]">
                                                <span style={{ color: 'var(--text-2)' }}>{desc}</span>
                                                <kbd className="font-mono text-[8px] px-1 py-0.5 rounded-sm glass-subtle"
                                                    style={{ color: 'var(--text-3)' }}>{keys}</kbd>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Capabilities */}
                                <div>
                                    <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider mb-1.5"
                                        style={{ color: 'var(--text-2)' }}>
                                        <Lightbulb size={9} /> Capabilities
                                    </div>
                                    <div className="space-y-0.5 text-[9px]" style={{ color: 'var(--text-3)' }}>
                                        {['Bug detection & fixes', 'Code refactoring', 'Performance optimization',
                                            'Code explanation', 'Large file support', 'Multi-file context'
                                        ].map((t, i) => <p key={i}>• {t}</p>)}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="shrink-0 px-4 py-2.5 border-t border-[var(--glass-border)]">
                <div className="text-[9px] text-[var(--text-4)] text-center">
                    Powered by Puter · Boosted by Ajay
                </div>
            </div>
        </motion.aside>
    );
});

export default Sidebar;
