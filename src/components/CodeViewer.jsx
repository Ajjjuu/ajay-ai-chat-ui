/**
 * CodeViewer — Glassy dedicated code viewer panel with Monaco editor.
 */
import { memo, useState, useCallback, useEffect } from 'react';
import { X, Copy, Check, Download, Maximize2, Minimize2, Sun, Moon, FileCode } from 'lucide-react';
import useChatStore from '../store/chatStore';

const CodeViewer = memo(function CodeViewer() {
    const codeViewerContent = useChatStore((s) => s.codeViewerContent);
    const closeCodeViewer = useChatStore((s) => s.closeCodeViewer);
    const theme = useChatStore((s) => s.theme);

    const [copied, setCopied] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [lightCode, setLightCode] = useState(false);
    const [MonacoEditor, setMonacoEditor] = useState(null);

    useEffect(() => {
        if (codeViewerContent && !MonacoEditor) {
            import('@monaco-editor/react').then((mod) => setMonacoEditor(() => mod.default));
        }
    }, [codeViewerContent, MonacoEditor]);

    const handleCopy = useCallback(async () => {
        if (!codeViewerContent) return;
        await navigator.clipboard.writeText(codeViewerContent.code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [codeViewerContent]);

    const handleDownload = useCallback(() => {
        if (!codeViewerContent) return;
        const blob = new Blob([codeViewerContent.code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = codeViewerContent.filename || `code.${codeViewerContent.language || 'txt'}`;
        a.click();
        URL.revokeObjectURL(url);
    }, [codeViewerContent]);

    if (!codeViewerContent) return null;
    const { code, language, filename } = codeViewerContent;
    const lineCount = (code.match(/\n/g) || []).length + 1;

    const monacoTheme = lightCode ? 'light' : (theme === 'dark' ? 'vs-dark' : 'light');

    const panelStyle = fullscreen
        ? { position: 'fixed', inset: 0, zIndex: 50 }
        : { width: '100%' }; // Adjusted to take full width of parent container

    return (
        <>
            {fullscreen && (
                <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-md" onClick={() => setFullscreen(false)} />
            )}

            <div
                className="h-full flex flex-col overflow-hidden shrink-0 transition-theme"
                style={{
                    ...panelStyle,
                    background: 'var(--sidebar-bg)',
                    backdropFilter: 'blur(24px) saturate(1.3)',
                    WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
                    borderLeft: fullscreen ? 'none' : '1px solid var(--glass-border)',
                    borderRadius: fullscreen ? '0' : undefined,
                }}
            >
                {/* Header */}
                <div className="shrink-0 flex items-center justify-between px-3 py-2.5"
                    style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <div className="flex items-center gap-2 min-w-0">
                        <FileCode size={13} style={{ color: 'var(--accent-1)' }} />
                        <div className="min-w-0">
                            <div className="text-[11px] font-medium truncate" style={{ color: 'var(--text-1)' }}>
                                {filename || `code.${language}`}
                            </div>
                            <div className="text-[8px]" style={{ color: 'var(--text-2)' }}>
                                {language?.toUpperCase()} · {lineCount}L · {code.length}C
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                        {[
                            { icon: lightCode ? Moon : Sun, onClick: () => setLightCode(v => !v), title: 'Theme' },
                            { icon: Download, onClick: handleDownload, title: 'Download' },
                            { icon: copied ? Check : Copy, onClick: handleCopy, title: 'Copy', color: copied ? 'var(--success)' : undefined },
                            { icon: fullscreen ? Minimize2 : Maximize2, onClick: () => setFullscreen(v => !v), title: 'Fullscreen' },
                            { icon: X, onClick: closeCodeViewer, title: 'Close' },
                        ].map((btn, i) => (
                            <button key={i} onClick={btn.onClick} title={btn.title}
                                className="p-1 rounded-sm transition-colors hover:bg-[hsl(var(--bg-glass-hover)/0.5)]"
                                style={{ color: btn.color || 'var(--text-3)' }}>
                                <btn.icon size={12} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-1 overflow-hidden">
                    {MonacoEditor ? (
                        <MonacoEditor
                            height="100%"
                            language={language || 'plaintext'}
                            theme={monacoTheme}
                            value={code}
                            options={{
                                readOnly: true,
                                minimap: { enabled: lineCount > 100 },
                                fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
                                lineNumbers: 'on', scrollBeyondLastLine: false, wordWrap: 'on',
                                renderLineHighlight: 'line', overviewRulerBorder: false,
                                scrollbar: { vertical: 'auto', verticalScrollbarSize: 6 },
                                padding: { top: 10, bottom: 10 },
                            }}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-[11px]"
                            style={{ color: 'var(--text-3)' }}>Loading editor…</div>
                    )}
                </div>

                <div className="shrink-0 px-3 py-1.5" style={{ borderTop: '1px solid var(--glass-border)' }}>
                    <div className="flex items-center justify-between text-[8px]" style={{ color: 'var(--text-4)' }}>
                        <span>Read-only</span>
                        <span>{lineCount} lines</span>
                    </div>
                </div>
            </div>
        </>
    );
});

export default CodeViewer;
