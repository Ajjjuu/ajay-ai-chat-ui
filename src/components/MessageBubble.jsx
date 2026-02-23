import { memo, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AlertCircle, Brain, Bot, ChevronDown, ChevronUp, FileText, User } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import CodeBlock from './CodeBlock';
import useChatStore from '../store/chatStore';

const ErrorBox = memo(function ErrorBox({ error }) {
  if (!error) return null;
  return (
    <div
      className="mt-2 rounded-lg border p-3 text-small"
      style={{
        borderColor: 'color-mix(in srgb, #ef4444 45%, var(--border))',
        background: 'color-mix(in srgb, #ef4444 12%, transparent)',
        color: '#ef4444',
      }}
    >
      <div className="mb-1 flex items-center gap-2 font-semibold">
        <AlertCircle size={16} strokeWidth={1.5} />
        System Error
      </div>
      <p className="mono whitespace-pre-wrap">{error}</p>
    </div>
  );
});

const ReasoningBox = memo(function ReasoningBox({ reasoning, duration }) {
  const [open, setOpen] = useState(false);
  if (!reasoning) return null;
  return (
    <div className="mb-2 rounded-lg border" style={{ borderColor: 'var(--border)' }}>
      <button
        className="btn btn-ghost w-full justify-between rounded-lg px-3 py-2 text-small"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2">
          <Brain size={16} strokeWidth={1.5} />
          Reasoning
        </span>
        <span className="flex items-center gap-2">
          <span className="text-small" style={{ color: 'var(--text-secondary)' }}>
            {duration ? `${duration}s` : `${reasoning.length} chars`}
          </span>
          {open ? <ChevronUp size={16} strokeWidth={1.5} /> : <ChevronDown size={16} strokeWidth={1.5} />}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 pb-3 text-small"
            style={{ color: 'var(--text-secondary)' }}
          >
            {reasoning}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

function createMarkdownComponents() {
  return {
    code({ inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const codeStr = String(children).replace(/\n$/, '');
      if (!inline && (match || codeStr.includes('\n'))) {
        return <CodeBlock code={codeStr} language={match?.[1] || ''} />;
      }
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    a({ href, children }) {
      return (
        <a href={href} target="_blank" rel="noreferrer">
          {children}
        </a>
      );
    },
  };
}

const MessageBubble = memo(function MessageBubble({ message, isStreaming }) {
  const { role, content, reasoning, duration, error, files, timestamp } = message;
  const isUser = role === 'user';
  const showThinking = useChatStore((s) => s.showThinking);
  const markdownComponents = useMemo(() => createMarkdownComponents(), []);
  const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)', color: 'var(--accent)' }}
        >
          <Bot size={20} strokeWidth={1.5} />
        </div>
      )}
      <div className={`min-w-0 ${isUser ? 'items-end' : 'items-start'} flex w-full max-w-4xl flex-col`}>
        <div className={`mb-1 flex items-center gap-2 text-small ${isUser ? 'justify-end' : ''}`} style={{ color: 'var(--text-secondary)' }}>
          <span className="font-medium">{isUser ? 'You' : 'Assistant'}</span>
          <span>{time}</span>
        </div>

        {!!files?.length && (
          <div className="mb-2 flex flex-wrap gap-2">
            {files.map((file, index) => (
              <span
                key={`${file.name}-${index}`}
                className="inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-small"
                style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
              >
                <FileText size={16} strokeWidth={1.5} />
                {file.name}
              </span>
            ))}
          </div>
        )}

        <div className={isUser ? 'message-user' : 'message-assistant'}>
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{content}</p>
          ) : (
            <div className={`prose-chat ${isStreaming ? 'typing-cursor' : ''}`}>
              {showThinking && <ReasoningBox reasoning={reasoning} duration={duration} />}
              {content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {content}
                </ReactMarkdown>
              ) : (
                !error && (
                  <p className="text-small" style={{ color: 'var(--text-secondary)' }}>
                    Processing...
                  </p>
                )
              )}
              <ErrorBox error={error} />
            </div>
          )}
        </div>
      </div>
      {isUser && (
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <User size={20} strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
});

export default MessageBubble;
