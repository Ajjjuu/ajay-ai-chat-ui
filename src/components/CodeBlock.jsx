import { memo, useCallback, useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, Maximize2, Minimize2, WrapText } from 'lucide-react';
import useChatStore from '../store/chatStore';

const CodeBlock = memo(function CodeBlock({ code, language, filename }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [wrap, setWrap] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState(null);
  const openCodeViewer = useChatStore((s) => s.openCodeViewer);

  const displayLang = language || 'text';
  const lines = code?.split('\n') || [];

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
    } finally {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  }, [code]);

  useEffect(() => {
    let cancelled = false;
    import('highlight.js/lib/core').then(async (hljs) => {
      if (cancelled) return;
      try {
        const langModule = await import(`highlight.js/lib/languages/${displayLang}`).catch(() => null);
        if (langModule && !hljs.default.getLanguage(displayLang)) {
          hljs.default.registerLanguage(displayLang, langModule.default);
        }
        const result = hljs.default.getLanguage(displayLang)
          ? hljs.default.highlight(code, { language: displayLang })
          : hljs.default.highlightAuto(code);
        if (!cancelled) setHighlightedHtml(result.value);
      } catch {
        if (!cancelled) setHighlightedHtml(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [code, displayLang]);

  return (
    <>
      {expanded && <button className="fixed inset-0 z-30 bg-black/35" onClick={() => setExpanded(false)} />}
      <div
        className={expanded ? 'fixed inset-4 z-40 flex flex-col overflow-hidden rounded-xl border' : 'rounded-xl border'}
        style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}
      >
        <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: 'var(--divider)' }}>
          <div className="flex items-center gap-2 text-small" style={{ color: 'var(--text-secondary)' }}>
            <span className="mono" style={{ color: 'var(--accent)' }}>{displayLang}</span>
            <span>{lines.length}L</span>
            {filename ? <span className="truncate">{filename}</span> : null}
          </div>
          <div className="flex items-center gap-1">
            <button className="btn btn-ghost p-1" onClick={() => setWrap((v) => !v)}><WrapText size={16} strokeWidth={1.5} /></button>
            <button className="btn btn-ghost p-1" onClick={() => openCodeViewer({ code, language: displayLang, filename: filename || `code.${displayLang}` })}><ExternalLink size={16} strokeWidth={1.5} /></button>
            <button className="btn btn-ghost p-1" onClick={() => setExpanded((v) => !v)}>{expanded ? <Minimize2 size={16} strokeWidth={1.5} /> : <Maximize2 size={16} strokeWidth={1.5} />}</button>
            <button className="btn btn-ghost p-1" onClick={handleCopy}>{copied ? <Check size={16} strokeWidth={1.5} color="var(--accent)" /> : <Copy size={16} strokeWidth={1.5} />}</button>
          </div>
        </div>

        <div className={`overflow-auto ${expanded ? 'flex-1' : 'max-h-[420px]'}`}>
          <pre className={`m-0 px-4 py-3 mono leading-6 ${wrap ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'}`}>
            {highlightedHtml ? <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} /> : <code>{code}</code>}
          </pre>
        </div>
      </div>
    </>
  );
});

export default CodeBlock;
