import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { ChevronDown, Code2, FileText, Paperclip, Send, Square, X } from 'lucide-react';
import useChatStore, { MODELS } from '../store/chatStore';
import { useChat } from '../hooks/useChat';

const ACCEPT_TYPES = {
  'text/plain': ['.txt', '.md'],
  'text/javascript': ['.js', '.jsx', '.mjs'],
  'text/typescript': ['.ts', '.tsx'],
  'application/json': ['.json'],
  'text/x-python': ['.py'],
  'text/html': ['.html', '.htm'],
  'text/css': ['.css'],
  'text/yaml': ['.yaml', '.yml'],
  'text/xml': ['.xml'],
};

const InputBox = memo(function InputBox() {
  const [input, setInput] = useState('');
  const [editorHeight, setEditorHeight] = useState(160);
  const [modelOpen, setModelOpen] = useState(false);
  const [MonacoEditor, setMonacoEditor] = useState(null);

  const textareaRef = useRef(null);
  const monacoValueRef = useRef('');

  const pasteCodeMode = useChatStore((s) => s.pasteCodeMode);
  const togglePasteCodeMode = useChatStore((s) => s.togglePasteCodeMode);
  const attachedFiles = useChatStore((s) => s.attachedFiles);
  const addFiles = useChatStore((s) => s.addFiles);
  const removeFile = useChatStore((s) => s.removeFile);
  const clearFiles = useChatStore((s) => s.clearFiles);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const activeChatId = useChatStore((s) => s.activeChatId);
  const selectedModel = useChatStore((s) => s.selectedModel);
  const setSelectedModel = useChatStore((s) => s.setSelectedModel);
  const theme = useChatStore((s) => s.theme);

  const { send, stop } = useChat();
  const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const processed = await Promise.all(
        acceptedFiles.map(async (file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
          content: await file.text(),
        }))
      );
      addFiles(processed);
    },
    [addFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT_TYPES,
    noClick: true,
    noKeyboard: true,
  });

  const handleSend = useCallback(() => {
    const content = pasteCodeMode ? monacoValueRef.current : input;
    if (!content.trim() && attachedFiles.length === 0) return;
    send(content, attachedFiles);
    setInput('');
    monacoValueRef.current = '';
  }, [input, pasteCodeMode, attachedFiles, send]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const attachFiles = useCallback(() => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = Object.values(ACCEPT_TYPES).flat().join(',');
    fileInput.onchange = async (event) => {
      const files = Array.from(event.target.files || []);
      const processed = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
          content: await file.text(),
        }))
      );
      addFiles(processed);
    };
    fileInput.click();
  }, [addFiles]);

  useEffect(() => {
    setInput('');
    monacoValueRef.current = '';
    clearFiles();
  }, [activeChatId, clearFiles]);

  useEffect(() => {
    if (pasteCodeMode && !MonacoEditor) {
      import('@monaco-editor/react').then((mod) => setMonacoEditor(() => mod.default));
    }
  }, [pasteCodeMode, MonacoEditor]);

  useEffect(() => {
    if (!textareaRef.current || pasteCodeMode) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(Math.max(textareaRef.current.scrollHeight, 48), 220)}px`;
  }, [input, pasteCodeMode]);

  const lineCount = (input.match(/\n/g) || []).length + 1;
  const charCount = input.length;

  return (
    <div className="space-y-3" {...getRootProps()}>
      <input {...getInputProps()} />

      {!!attachedFiles.length && (
        <div className="flex flex-wrap gap-2">
          {attachedFiles.map((file, idx) => (
            <span
              key={`${file.name}-${idx}`}
              className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-small"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
            >
              <FileText size={16} strokeWidth={1.5} />
              <span className="max-w-[180px] truncate">{file.name}</span>
              <button className="btn btn-ghost p-0" onClick={() => removeFile(idx)}>
                <X size={16} strokeWidth={1.5} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div
        className="input-surface transition-theme overflow-hidden"
        style={{
          borderColor: isDragActive ? 'var(--accent)' : 'var(--border)',
          background: isDragActive
            ? 'color-mix(in srgb, var(--accent) 14%, var(--bg-tertiary))'
            : 'var(--bg-tertiary)',
        }}
      >
        {pasteCodeMode && MonacoEditor ? (
          <div style={{ height: editorHeight }}>
            <MonacoEditor
              height="100%"
              defaultLanguage="javascript"
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              value={input}
              onChange={(value) => {
                setInput(value || '');
                monacoValueRef.current = value || '';
              }}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'Fira Code', Monaco, monospace",
                lineNumbers: 'on',
                wordWrap: 'on',
                padding: { top: 12, bottom: 12 },
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full resize-none border-0 bg-transparent px-4 py-3 text-[14px] outline-none"
            style={{ color: 'var(--text-primary)' }}
            placeholder="Message Ajjjuu AI"
            rows={1}
          />
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2" style={{ borderColor: 'var(--divider)' }}>
          <div className="flex items-center gap-2">
            <button className={pasteCodeMode ? 'btn btn-secondary !px-3 !py-2' : 'btn btn-ghost !px-3 !py-2'} onClick={togglePasteCodeMode}>
              <Code2 size={20} strokeWidth={1.5} />
              Code
            </button>
            <button className="btn btn-ghost !px-3 !py-2" onClick={attachFiles}>
              <Paperclip size={20} strokeWidth={1.5} />
              Attach
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="mono text-small" style={{ color: 'var(--text-secondary)' }}>
              {lineCount}L • {charCount}C
            </span>
            {isStreaming ? (
              <button className="btn btn-secondary" onClick={stop}>
                <Square size={20} strokeWidth={1.5} />
                Stop
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleSend} disabled={!input.trim() && attachedFiles.length === 0}>
                <Send size={20} strokeWidth={1.5} />
                Send
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-between gap-2">
        <button className="btn btn-ghost !px-3 !py-2" onClick={() => setModelOpen((v) => !v)}>
          <span style={{ color: 'var(--text-primary)' }}>{currentModel.label}</span>
          <ChevronDown size={20} strokeWidth={1.5} className={modelOpen ? 'rotate-180' : ''} />
        </button>
        <p className="text-small" style={{ color: 'var(--text-secondary)' }}>
          Enter to send • Shift+Enter for newline
        </p>

        <AnimatePresence>
          {modelOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="chat-panel absolute bottom-11 left-0 z-20 w-full max-w-[320px] p-2"
              style={{ background: 'var(--bg-primary)' }}
            >
              {MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model.id);
                    setModelOpen(false);
                  }}
                  className="btn btn-ghost w-full justify-between text-left"
                  style={{
                    color: selectedModel === model.id ? 'var(--accent)' : 'var(--text-primary)',
                    background: selectedModel === model.id ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
                  }}
                >
                  <span>{model.label}</span>
                  <span className="text-small" style={{ color: 'var(--text-secondary)' }}>
                    {model.description}
                  </span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {pasteCodeMode && (
        <div className="text-small" style={{ color: 'var(--text-secondary)' }}>
          <label className="mr-2">Editor height</label>
          <input
            type="range"
            min={120}
            max={420}
            value={editorHeight}
            onChange={(e) => setEditorHeight(Number(e.target.value))}
          />
        </div>
      )}
    </div>
  );
});

export default InputBox;
