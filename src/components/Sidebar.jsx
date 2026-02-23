import { memo, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Trash2, Pencil, Check, X, Moon, Sun, MessageSquare, PanelLeftClose } from 'lucide-react';
import useChatStore from '../store/chatStore';

const ChatItem = memo(function ChatItem({ chat, active, onSelect, onDelete, onRename }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(chat.title);

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
    <div
      className={`sidebar-item transition-theme group cursor-pointer rounded-r-lg px-3 py-3 ${active ? 'active' : ''}`}
      onClick={() => onSelect(chat.id)}
    >
      {editing ? (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            className="w-full rounded-md border px-2 py-1 text-[12px]"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setEditing(false);
                if (draft.trim()) onRename(chat.id, draft.trim());
              }
              if (e.key === 'Escape') {
                setEditing(false);
                setDraft(chat.title);
              }
            }}
          />
          <button
            className="btn btn-ghost p-1"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(false);
              if (draft.trim()) onRename(chat.id, draft.trim());
            }}
          >
            <Check size={16} strokeWidth={1.5} />
          </button>
          <button
            className="btn btn-ghost p-1"
            onClick={(e) => {
              e.stopPropagation();
              setEditing(false);
              setDraft(chat.title);
            }}
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <MessageSquare size={16} strokeWidth={1.5} style={{ color: 'var(--text-secondary)' }} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium" style={{ color: 'var(--text-primary)' }}>
              {chat.title}
            </p>
            <p className="text-small truncate" style={{ color: 'var(--text-secondary)' }}>
              {chat.messages.length} msgs • {timeAgo}
            </p>
          </div>
          <div className="hidden group-hover:flex items-center gap-1">
            <button
              className="btn btn-ghost p-1"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
            >
              <Pencil size={16} strokeWidth={1.5} />
            </button>
            <button
              className="btn btn-ghost p-1"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(chat.id);
              }}
            >
              <Trash2 size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

const Sidebar = memo(function Sidebar({ isMobile }) {
  const chats = useChatStore((s) => s.chats);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const newChat = useChatStore((s) => s.newChat);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const deleteChat = useChatStore((s) => s.deleteChat);
  const renameChat = useChatStore((s) => s.renameChat);
  const toggleSidebar = useChatStore((s) => s.toggleSidebar);
  const searchQuery = useChatStore((s) => s.searchQuery);
  const setSearchQuery = useChatStore((s) => s.setSearchQuery);
  const theme = useChatStore((s) => s.theme);
  const toggleTheme = useChatStore((s) => s.toggleTheme);

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const query = searchQuery.toLowerCase();
    return chats.filter((chat) => {
      if (chat.title.toLowerCase().includes(query)) return true;
      return chat.messages.some((m) => m.content.toLowerCase().includes(query));
    });
  }, [chats, searchQuery]);

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -20, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="app-sidebar transition-theme z-40 flex h-full flex-col"
    >
      <div className="px-4 pb-3 pt-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2>Ajjjuu AI</h2>
            <p className="text-small" style={{ color: 'var(--text-secondary)' }}>
              Conversation workspace
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button className="btn btn-ghost p-2" onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
            </button>
            <button className="btn btn-ghost p-2" onClick={toggleSidebar} title="Close sidebar">
              <PanelLeftClose size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <button className="btn btn-primary w-full justify-center" onClick={newChat}>
          <Plus size={20} strokeWidth={1.5} />
          New Chat
        </button>
      </div>

      <div className="px-4 pb-3">
        <label className="relative block">
          <Search size={20} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats"
            className="w-full rounded-lg border py-2 pl-10 pr-3 text-[14px] outline-none transition-theme"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
            }}
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto pb-3">
        {filteredChats.map((chat) => (
          <ChatItem
            key={chat.id}
            chat={chat}
            active={chat.id === activeChatId}
            onSelect={(id) => {
              setActiveChat(id);
              if (isMobile) toggleSidebar();
            }}
            onDelete={deleteChat}
            onRename={renameChat}
          />
        ))}
        {!filteredChats.length && (
          <p className="px-4 py-6 text-center text-small" style={{ color: 'var(--text-secondary)' }}>
            No chats found
          </p>
        )}
      </div>
    </motion.aside>
  );
});

export default Sidebar;
