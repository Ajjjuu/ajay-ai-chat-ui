import { memo, useCallback, useEffect, useState } from 'react';
import { Check, Copy, Download, Maximize2, Minimize2, Moon, Sun, X } from 'lucide-react';
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
    setTimeout(() => setCopied(false), 1800);
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
  const lineCount = (codeViewerContent.code.match(/\n/g) || []).length + 1;

  return (
    <>
      {fullscreen && <button className="fixed inset-0 z-40 bg-black/35" onClick={() => setFullscreen(false)} />}
      <div
        className={fullscreen ? 'fixed inset-0 z-50 flex h-full flex-col' : 'flex h-full flex-col'}
        style={{ background: 'var(--bg-secondary)' }}
      >
        <div className="flex items-center justify-between border-b px-3 py-2" style={{ borderColor: 'var(--divider)' }}>
          <div className="min-w-0">
            <p className="truncate font-medium">{codeViewerContent.filename || `code.${codeViewerContent.language || 'txt'}`}</p>
            <p className="text-small" style={{ color: 'var(--text-secondary)' }}>
              {(codeViewerContent.language || 'plain').toUpperCase()} • {lineCount} lines
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button className="btn btn-ghost p-1" onClick={() => setLightCode((v) => !v)}>{lightCode ? <Moon size={16} strokeWidth={1.5} /> : <Sun size={16} strokeWidth={1.5} />}</button>
            <button className="btn btn-ghost p-1" onClick={handleDownload}><Download size={16} strokeWidth={1.5} /></button>
            <button className="btn btn-ghost p-1" onClick={handleCopy}>{copied ? <Check size={16} strokeWidth={1.5} color="var(--accent)" /> : <Copy size={16} strokeWidth={1.5} />}</button>
            <button className="btn btn-ghost p-1" onClick={() => setFullscreen((v) => !v)}>{fullscreen ? <Minimize2 size={16} strokeWidth={1.5} /> : <Maximize2 size={16} strokeWidth={1.5} />}</button>
            <button className="btn btn-ghost p-1" onClick={closeCodeViewer}><X size={16} strokeWidth={1.5} /></button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {MonacoEditor ? (
            <MonacoEditor
              height="100%"
              language={codeViewerContent.language || 'plaintext'}
              theme={lightCode ? 'light' : theme === 'dark' ? 'vs-dark' : 'light'}
              value={codeViewerContent.code}
              options={{
                readOnly: true,
                minimap: { enabled: lineCount > 100 },
                fontSize: 13,
                fontFamily: "'Fira Code', Monaco, monospace",
                lineNumbers: 'on',
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                padding: { top: 12, bottom: 12 },
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-small" style={{ color: 'var(--text-secondary)' }}>
              Loading editor...
            </div>
          )}
        </div>
      </div>
    </>
  );
});

export default CodeViewer;
