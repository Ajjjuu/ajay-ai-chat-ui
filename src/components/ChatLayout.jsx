import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Menu, Moon, Sun, Brain, PanelRight } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import useChatStore from '../store/chatStore';
import Sidebar from './Sidebar';
import CodeViewer from './CodeViewer';
import MessageBubble from './MessageBubble';
import InputBox from './InputBox';
import WelcomeScreen from './WelcomeScreen';

const TopBar = memo(function TopBar({ isMobile }) {
  const sidebarOpen = useChatStore((s) => s.sidebarOpen);
  const toggleSidebar = useChatStore((s) => s.toggleSidebar);
  const activeChat = useChatStore((s) => s.chats.find((c) => c.id === s.activeChatId) ?? s.chats[0]);
  const theme = useChatStore((s) => s.theme);
  const toggleTheme = useChatStore((s) => s.toggleTheme);
  const showThinking = useChatStore((s) => s.showThinking);
  const toggleShowThinking = useChatStore((s) => s.toggleShowThinking);
  const rightPanelOpen = useChatStore((s) => s.rightPanelOpen);
  const toggleRightPanel = useChatStore((s) => s.toggleRightPanel);

  return (
    <header
      className="transition-theme flex items-center justify-between px-4 py-3"
      style={{ borderBottom: '1px solid var(--divider)', background: 'var(--surface-frost)' }}
    >
      <div className="flex items-center gap-2 min-w-0">
        {(!sidebarOpen || isMobile) && (
          <button className="btn btn-ghost p-2" onClick={toggleSidebar} aria-label="Toggle sidebar">
            <Menu size={20} strokeWidth={1.5} />
          </button>
        )}
        <div className="min-w-0">
          <h3 className="truncate">{activeChat?.title || 'New Chat'}</h3>
          <p className="text-small truncate" style={{ color: 'var(--text-secondary)' }}>
            {(activeChat?.messages?.length || 0)} messages
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="btn btn-ghost p-2"
          onClick={toggleShowThinking}
          title={showThinking ? 'Hide reasoning' : 'Show reasoning'}
        >
          <Brain size={20} strokeWidth={1.5} color={showThinking ? 'var(--accent)' : 'currentColor'} />
        </button>
        <button className="btn btn-ghost p-2" onClick={toggleRightPanel} title="Toggle code viewer">
          <PanelRight size={20} strokeWidth={1.5} color={rightPanelOpen ? 'var(--accent)' : 'currentColor'} />
        </button>
        <button className="btn btn-ghost p-2" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? (
            <Sun size={20} strokeWidth={1.5} />
          ) : (
            <Moon size={20} strokeWidth={1.5} />
          )}
        </button>
      </div>
    </header>
  );
});

const MessageList = memo(function MessageList() {
  const messages = useChatStore((s) => (s.chats.find((c) => c.id === s.activeChatId)?.messages ?? []));
  const isStreaming = useChatStore((s) => s.isStreaming);
  const virtuosoRef = useRef(null);

  useEffect(() => {
    if (!isStreaming || messages.length === 0 || !virtuosoRef.current) return;
    virtuosoRef.current.scrollToIndex({
      index: messages.length - 1,
      behavior: 'smooth',
      align: 'end',
    });
  }, [isStreaming, messages.length, messages[messages.length - 1]?.content]);

  if (!messages.length) return <WelcomeScreen />;

  return (
    <Virtuoso
      ref={virtuosoRef}
      data={messages}
      followOutput="smooth"
      className="h-full w-full"
      itemContent={(index, message) => (
        <div className="px-3 py-2 md:px-6 lg:px-8">
          <MessageBubble message={message} isStreaming={isStreaming && index === messages.length - 1} />
        </div>
      )}
      components={{
        Header: () => <div className="h-2" />,
        Footer: () => <div className="h-2" />,
      }}
    />
  );
});

const ChatLayout = memo(function ChatLayout() {
  const sidebarOpen = useChatStore((s) => s.sidebarOpen);
  const toggleSidebar = useChatStore((s) => s.toggleSidebar);
  const rightPanelOpen = useChatStore((s) => s.rightPanelOpen);
  const codeViewerContent = useChatStore((s) => s.codeViewerContent);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const showSidebarOverlay = sidebarOpen && isMobile;
  const showCodeViewer = rightPanelOpen && codeViewerContent;
  const rightPanelClass = useMemo(
    () =>
      isMobile
        ? 'mobile-sheet transition-theme max-h-[58vh] overflow-hidden border'
        : 'w-[34%] min-w-[320px] max-w-[520px] border-l transition-theme',
    [isMobile]
  );

  return (
    <div className="app-shell transition-theme">
      <AnimatePresence>
        {sidebarOpen && <Sidebar isMobile={isMobile} />}
      </AnimatePresence>

      {showSidebarOverlay && (
        <button
          className="fixed inset-0 z-30 bg-black/35"
          aria-label="Close sidebar overlay"
          onClick={toggleSidebar}
        />
      )}

      <main className="chat-main transition-theme" style={{ background: 'var(--bg-primary)' }}>
        <TopBar isMobile={isMobile} />

        <section className="flex-1 min-h-0 overflow-hidden">
          <MessageList />
        </section>

        <footer className="transition-theme px-3 py-3 md:px-6 md:py-4" style={{ borderTop: '1px solid var(--divider)' }}>
          <InputBox />
        </footer>
      </main>

      <AnimatePresence>
        {showCodeViewer && (
          <aside className={rightPanelClass} style={!isMobile ? { borderColor: 'var(--divider)' } : { borderColor: 'var(--divider)', background: 'var(--bg-secondary)' }}>
            <CodeViewer />
          </aside>
        )}
      </AnimatePresence>
    </div>
  );
});

export default ChatLayout;
