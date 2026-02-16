/**
 * CodeBlock — Glassy code block without line numbers, with copy/expand/viewer.
 */
import { memo, useState, useCallback, useEffect } from 'react';
import { Copy, Check, Maximize2, Minimize2, WrapText, ExternalLink } from 'lucide-react';
import useChatStore from '../store/chatStore';

const CodeBlock = memo(function CodeBlock({ code, language, filename }) {
    const [copied, setCopied] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [wordWrap, setWordWrap] = useState(false);
    const [highlightedHtml, setHighlightedHtml] = useState(null);
    const openCodeViewer = useChatStore((s) => s.openCodeViewer);

    const lines = code?.split('\n') || [];
    const lineCount = lines.length;
    const displayLang = language || 'text';

    const handleCopy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(code);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = code;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [code]);

    const handleOpenViewer = useCallback(() => {
        openCodeViewer({ code, language: displayLang, filename: filename || `code.${displayLang}` });
    }, [code, displayLang, filename, openCodeViewer]);

    useEffect(() => {
        let cancelled = false;
        import('highlight.js/lib/core').then(async (hljs) => {
            if (cancelled) return;
            try {
                const langMod = await import(`highlight.js/lib/languages/${displayLang}`).catch(() => null);
                if (langMod && !hljs.default.getLanguage(displayLang)) {
                    hljs.default.registerLanguage(displayLang, langMod.default);
                }
                const result = hljs.default.getLanguage(displayLang)
                    ? hljs.default.highlight(code, { language: displayLang })
                    : hljs.default.highlightAuto(code);
                if (!cancelled) setHighlightedHtml(result.value);
            } catch {
                if (!cancelled) setHighlightedHtml(null);
            }
        });
        return () => { cancelled = true; };
    }, [code, displayLang]);

    const containerClass = expanded
        ? 'fixed inset-6 z-50 flex flex-col rounded-sm overflow-hidden'
        : 'relative rounded-sm overflow-hidden';

    return (
        <>
            {expanded && (
                <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-md" onClick={() => setExpanded(false)} />
            )}

            <div
                className={containerClass}
                style={{
                    background: 'var(--code-bg)',
                    border: '1px solid var(--glass-border)',
                    boxShadow: '0 4px 24px -4px var(--glass-shadow)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-1.5"
                    style={{ background: 'var(--code-header)', borderBottom: '1px solid var(--glass-border)' }}>
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-semibold font-mono uppercase tracking-widest text-[var(--accent-1)]">
                            {displayLang}
                        </span>
                        <span className="text-[9px] text-[var(--text-3)]">{lineCount}L</span>
                        {filename && <span className="text-[9px] text-[var(--text-4)] truncate max-w-[120px]">· {filename}</span>}
                    </div>
                    <div className="flex items-center gap-0.5">
                        {[
                            { icon: WrapText, active: wordWrap, onClick: () => setWordWrap(v => !v), title: 'Wrap' },
                            { icon: ExternalLink, onClick: handleOpenViewer, title: 'Open viewer' },
                            { icon: expanded ? Minimize2 : Maximize2, onClick: () => setExpanded(v => !v), title: expanded ? 'Minimize' : 'Expand' },
                            { icon: copied ? Check : Copy, active: copied, color: copied ? 'var(--success)' : undefined, onClick: handleCopy, title: 'Copy' },
                        ].map((btn, i) => (
                            <button
                                key={i}
                                onClick={btn.onClick}
                                className="p-1 rounded-sm transition-all duration-150 hover:bg-[hsl(var(--bg-glass-hover)/0.5)]"
                                style={{ color: btn.color || (btn.active ? 'var(--accent-1)' : 'var(--text-3)') }}
                                title={btn.title}
                            >
                                <btn.icon size={12} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Code Body — no line numbers */}
                <div className={`overflow-auto ${expanded ? 'flex-1' : 'max-h-[420px]'}`}>
                    <pre
                        className={`px-4 py-3 text-[11px] font-mono leading-[1.7] ${wordWrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'
                            }`}
                        style={{ margin: 0, background: 'transparent' }}
                    >
                        {highlightedHtml ? (
                            <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
                        ) : (
                            <code>{code}</code>
                        )}
                    </pre>
                </div>
            </div>
        </>
    );
});

export default CodeBlock;
