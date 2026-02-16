/**
 * ChatLayout — 3-panel layout. Right panel only shows CodeViewer now.
 */
import { memo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeftOpen, Sun, Moon } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import useChatStore from '../store/chatStore';
import Sidebar from './Sidebar';
import CodeViewer from './CodeViewer';
import MessageBubble from './MessageBubble';
import InputBox from './InputBox';
import WelcomeScreen from './WelcomeScreen';

// ── Top Bar ─────────────────────────────────────────────────
const TopBar = memo(function TopBar() {
    const sidebarOpen = useChatStore((s) => s.sidebarOpen);
    const toggleSidebar = useChatStore((s) => s.toggleSidebar);
    const getActiveChat = useChatStore((s) => s.getActiveChat);
    const theme = useChatStore((s) => s.theme);
    const toggleTheme = useChatStore((s) => s.toggleTheme);

    const activeChat = getActiveChat();

    return (
        <div
            className="shrink-0 flex items-center justify-between px-4 py-2 transition-theme"
            style={{
                background: 'var(--topbar-bg)',
                backdropFilter: 'blur(20px) saturate(1.3)',
                WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
                borderBottom: '1px solid var(--glass-border)',
            }}
        >
            <div className="flex items-center gap-3">
                {!sidebarOpen && (
                    <button onClick={toggleSidebar}
                        className="p-1.5 rounded-sm transition-all duration-200 hover:bg-[hsl(var(--bg-glass-hover)/0.5)]"
                        style={{ color: 'var(--text-2)' }}
                        title="Open sidebar (Ctrl+B)">
                        <PanelLeftOpen size={15} />
                    </button>
                )}
                <div className="min-w-0">
                    <h2 className="text-[12px] font-semibold truncate" style={{ color: 'var(--text-1)' }}>
                        {activeChat?.title || 'New Chat'}
                    </h2>
                    <p className="text-[9px]" style={{ color: 'var(--text-2)' }}>
                        {activeChat?.messages?.length || 0} messages
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-1">
                {!sidebarOpen && (
                    <button onClick={toggleTheme}
                        className="p-1.5 rounded-sm transition-all duration-200 hover:bg-[hsl(var(--bg-glass-hover)/0.5)]"
                        style={{ color: 'var(--text-2)' }}
                        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                        {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
                    </button>
                )}
            </div>
        </div>
    );
});

// ── Message List ────────────────────────────────────────────
const MessageList = memo(function MessageList() {
    const getActiveChat = useChatStore((s) => s.getActiveChat);
    const isStreaming = useChatStore((s) => s.isStreaming);
    const virtuosoRef = useRef(null);

    const chat = getActiveChat();
    const messages = chat?.messages || [];

    useEffect(() => {
        if (isStreaming && virtuosoRef.current) {
            virtuosoRef.current.scrollToIndex({
                index: messages.length - 1,
                behavior: 'smooth',
                align: 'end',
            });
        }
    }, [isStreaming, messages.length, messages[messages.length - 1]?.content]);

    if (messages.length === 0) return <WelcomeScreen />;

    return (
        <div className="flex-1 relative">
            <Virtuoso
                ref={virtuosoRef}
                data={messages}
                totalCount={messages.length}
                followOutput="smooth"
                className="h-full"
                itemContent={(index, message) => (
                    <div className="px-4 md:px-8 lg:px-20 py-2">
                        <div className="max-w-4xl mx-auto">
                            <MessageBubble
                                message={message}
                                isStreaming={isStreaming && index === messages.length - 1}
                            />
                        </div>
                    </div>
                )}
                components={{
                    Header: () => <div className="h-3" />,
                    Footer: () => <div className="h-3" />,
                }}
            />
        </div>
    );
});

// ── Right Panel (Code Viewer only) ──────────────────────────
const RightPanel = memo(function RightPanel() {
    const rightPanelOpen = useChatStore((s) => s.rightPanelOpen);
    const codeViewerContent = useChatStore((s) => s.codeViewerContent);

    if (!rightPanelOpen || !codeViewerContent) return null;

    return <CodeViewer />;
});

// ── Main Layout ─────────────────────────────────────────────
const ChatLayout = memo(function ChatLayout() {
    return (
        <div className="relative flex h-full w-full overflow-hidden transition-theme"
            style={{ background: 'hsl(var(--bg-body))', zIndex: 1 }}>
            <AnimatePresence mode="wait">
                <Sidebar />
            </AnimatePresence>

            <div className="flex-1 flex flex-col min-w-0">
                <TopBar />
                <MessageList />
                <InputBox />
            </div>

            <AnimatePresence mode="wait">
                <RightPanel />
            </AnimatePresence>
        </div>
    );
});

export default ChatLayout;
