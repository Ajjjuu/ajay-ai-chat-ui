/**
 * MessageBubble — Clean message bubble without toolbar.
 */
import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, FileText } from 'lucide-react';
import CodeBlock from './CodeBlock';

function createMarkdownComponents() {
    return {
        code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeStr = String(children).replace(/\n$/, '');
            if (!inline && (match || codeStr.includes('\n'))) {
                return <CodeBlock code={codeStr} language={match?.[1] || ''} />;
            }
            return <code className={className} {...props}>{children}</code>;
        },
        a({ href, children }) {
            return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
        },
    };
}

const MessageBubble = memo(function MessageBubble({ message, isStreaming }) {
    const { role, content, files, timestamp } = message;
    const isUser = role === 'user';

    const markdownComponents = useMemo(() => createMarkdownComponents(), []);

    const timeStr = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className={`group flex gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Avatar */}
            <div
                className="shrink-0 mt-0.5 w-7 h-7 rounded-sm flex items-center justify-center"
                style={isUser
                    ? { background: 'var(--gradient-main)', boxShadow: '0 2px 12px -2px hsla(258,80%,66%,0.3)' }
                    : { background: 'hsl(var(--bg-glass))', border: '1px solid var(--glass-border)' }
                }
            >
                {isUser
                    ? <User size={12} className="text-white" />
                    : <Bot size={12} style={{ color: 'var(--accent-1)' }} />
                }
            </div>

            {/* Bubble */}
            <div className={`max-w-[82%] min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-center gap-2 mb-1 ${isUser ? 'justify-end' : ''}`}>
                    <span className="text-[9px] font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--text-2)' }}>
                        {isUser ? 'You' : 'Assistant'}
                    </span>
                    <span className="text-[8px]" style={{ color: 'var(--text-3)' }}>{timeStr}</span>
                </div>

                {/* File chips */}
                {files?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1.5">
                        {files.map((f, i) => (
                            <span key={i}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono
                           rounded-sm glass-subtle"
                                style={{ color: 'var(--text-2)' }}
                            >
                                <FileText size={9} style={{ color: 'var(--accent-1)' }} />
                                {f.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Content */}
                <div
                    className="rounded-sm px-3.5 py-2.5"
                    style={{
                        background: isUser ? 'var(--user-bubble-bg)' : 'var(--assistant-bubble-bg)',
                        border: `1px solid ${isUser ? 'var(--user-bubble-border)' : 'var(--assistant-bubble-border)'}`,
                        backdropFilter: 'blur(16px) saturate(1.2)',
                        WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
                    }}
                >
                    {isUser ? (
                        <div className="prose-chat whitespace-pre-wrap break-words text-[12px]"
                            style={{ color: 'var(--text-1)' }}>
                            {content}
                        </div>
                    ) : (
                        <div className={`prose-chat ${isStreaming ? 'typing-cursor' : ''}`}>
                            {content ? (
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                                    {content}
                                </ReactMarkdown>
                            ) : (
                                <div className="flex items-center gap-2" style={{ color: 'var(--text-2)' }}>
                                    <div className="flex gap-1">
                                        {[0, 150, 300].map((d) => (
                                            <div key={d} className="w-1 h-1 rounded-full animate-pulse-soft"
                                                style={{ background: 'var(--accent-1)', animationDelay: `${d}ms` }} />
                                        ))}
                                    </div>
                                    <span className="text-[11px]">Thinking…</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

export default MessageBubble;
