/**
 * InputBox — Glassy input with model selector below, Enter to send, Shift+Enter for newline.
 */
import { useState, useRef, useCallback, useEffect, memo } from 'react';
import {
    Send, Square, Code2, Paperclip, X, FileText, GripHorizontal,
    ChevronDown
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
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
    'text/x-rust': ['.rs'],
    'text/x-go': ['.go'],
    'text/x-java': ['.java'],
    'text/x-c': ['.c', '.h'],
    'text/x-cpp': ['.cpp', '.hpp', '.cc'],
};

const InputBox = memo(function InputBox() {
    const [input, setInput] = useState('');
    const [editorHeight, setEditorHeight] = useState(120);
    const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
    const textareaRef = useRef(null);
    const monacoRef = useRef(null);

    const pasteCodeMode = useChatStore((s) => s.pasteCodeMode);
    const togglePasteCodeMode = useChatStore((s) => s.togglePasteCodeMode);
    const attachedFiles = useChatStore((s) => s.attachedFiles);
    const addFiles = useChatStore((s) => s.addFiles);
    const removeFile = useChatStore((s) => s.removeFile);
    const isStreaming = useChatStore((s) => s.isStreaming);
    const theme = useChatStore((s) => s.theme);
    const selectedModel = useChatStore((s) => s.selectedModel);
    const setSelectedModel = useChatStore((s) => s.setSelectedModel);

    const { send, stop } = useChat();

    const currentModel = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

    const onDrop = useCallback(async (acceptedFiles) => {
        const processed = await Promise.all(
            acceptedFiles.map(async (file) => ({
                name: file.name, size: file.size, type: file.type, content: await file.text(),
            }))
        );
        addFiles(processed);
    }, [addFiles]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, accept: ACCEPT_TYPES, noClick: true, noKeyboard: true,
    });

    const handleSend = useCallback(() => {
        const content = pasteCodeMode && monacoRef.current ? monacoRef.current : input;
        if (!content.trim() && attachedFiles.length === 0) return;
        send(content, attachedFiles);
        setInput('');
        if (monacoRef.current) monacoRef.current = '';
    }, [input, pasteCodeMode, attachedFiles, send]);

    // Enter to send, Shift+Enter for newline
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
        if (e.key === 'Tab') {
            e.preventDefault();
            const t = e.target;
            const s = t.selectionStart, end = t.selectionEnd;
            setInput(input.substring(0, s) + '  ' + input.substring(end));
            setTimeout(() => { t.selectionStart = t.selectionEnd = s + 2; }, 0);
        }
    }, [handleSend, input]);

    useEffect(() => {
        if (textareaRef.current && !pasteCodeMode) {
            const el = textareaRef.current;
            el.style.height = 'auto';
            el.style.height = Math.min(Math.max(el.scrollHeight, 40), 260) + 'px';
        }
    }, [input, pasteCodeMode]);

    const handleResizeStart = useCallback((e) => {
        e.preventDefault();
        const startY = e.clientY, startH = editorHeight;
        const onMove = (e) => setEditorHeight(Math.max(80, Math.min(500, startH + (startY - e.clientY))));
        const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, [editorHeight]);

    const handleFileAttach = useCallback(() => {
        const fi = document.createElement('input');
        fi.type = 'file'; fi.multiple = true;
        fi.accept = Object.values(ACCEPT_TYPES).flat().join(',');
        fi.onchange = async (e) => {
            const processed = await Promise.all(
                Array.from(e.target.files).map(async (f) => ({
                    name: f.name, size: f.size, type: f.type, content: await f.text(),
                }))
            );
            addFiles(processed);
        };
        fi.click();
    }, [addFiles]);

    const [MonacoEditor, setMonacoEditor] = useState(null);
    useEffect(() => {
        if (pasteCodeMode && !MonacoEditor) {
            import('@monaco-editor/react').then((mod) => setMonacoEditor(() => mod.default));
        }
    }, [pasteCodeMode, MonacoEditor]);

    const lineCount = (input.match(/\n/g) || []).length + 1;
    const charCount = input.length;

    return (
        <div className="px-4 md:px-8 lg:px-20 pb-3 pt-1">
            <div className="max-w-4xl mx-auto">
                <div
                    {...getRootProps()}
                    className="relative rounded-sm transition-all duration-250"
                    style={{
                        background: isDragActive
                            ? 'hsla(258,80%,66%,0.06)'
                            : 'hsl(var(--bg-glass) / 0.45)',
                        backdropFilter: 'blur(20px) saturate(1.3)',
                        WebkitBackdropFilter: 'blur(20px) saturate(1.3)',
                        border: isDragActive
                            ? '1.5px solid var(--accent-1)'
                            : '1px solid var(--glass-border)',
                        boxShadow: isDragActive
                            ? '0 0 30px -6px hsla(258,80%,66%,0.2)'
                            : '0 4px 24px -8px var(--glass-shadow)',
                    }}
                >
                    <input {...getInputProps()} />

                    {isDragActive && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-sm"
                            style={{ background: 'hsla(258,80%,66%,0.04)', border: '2px dashed var(--accent-1)' }}>
                            <div className="font-medium flex items-center gap-2 text-[12px]" style={{ color: 'var(--accent-1)' }}>
                                <FileText size={16} /> Drop files here
                            </div>
                        </div>
                    )}

                    {/* Resize */}
                    <div className="resize-handle flex items-center justify-center h-2.5 rounded-t-sm cursor-ns-resize"
                        onMouseDown={handleResizeStart}>
                        <GripHorizontal size={12} style={{ color: 'var(--text-4)' }} />
                    </div>

                    {/* File chips */}
                    {attachedFiles.length > 0 && (
                        <div className="flex flex-wrap gap-1 px-3 pb-1.5">
                            {attachedFiles.map((file, i) => (
                                <span key={i}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-mono
                             rounded-sm glass-subtle group">
                                    <FileText size={9} style={{ color: 'var(--accent-1)' }} />
                                    <span className="max-w-[100px] truncate" style={{ color: 'var(--text-2)' }}>{file.name}</span>
                                    <span className="text-[8px]" style={{ color: 'var(--text-4)' }}>
                                        {(file.size / 1024).toFixed(1)}K
                                    </span>
                                    <button onClick={() => removeFile(i)}
                                        className="ml-0.5 p-0.5 rounded-sm hover:bg-[var(--error)]/15 transition-colors"
                                        style={{ color: 'var(--text-3)' }}>
                                        <X size={8} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Editor */}
                    {pasteCodeMode && MonacoEditor ? (
                        <div className="px-1" style={{ height: editorHeight }}>
                            <MonacoEditor
                                height="100%"
                                defaultLanguage="javascript"
                                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                                value={input}
                                onChange={(v) => { setInput(v || ''); monacoRef.current = v || ''; }}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 12,
                                    fontFamily: "'JetBrains Mono', monospace",
                                    lineNumbers: 'on',
                                    scrollBeyondLastLine: false,
                                    wordWrap: 'on',
                                    tabSize: 2,
                                    renderLineHighlight: 'none',
                                    overviewRulerBorder: false,
                                    hideCursorInOverviewRuler: true,
                                    scrollbar: { vertical: 'auto', horizontal: 'auto', verticalScrollbarSize: 5, horizontalScrollbarSize: 5 },
                                    padding: { top: 6, bottom: 6 },
                                }}
                            />
                        </div>
                    ) : (
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={pasteCodeMode ? 'Paste your code here…' : 'Ask anything… (Enter to send, Shift+Enter for new line)'}
                            className="block w-full resize-none bg-transparent px-3.5 py-2 text-[12px]
                         placeholder:text-[var(--text-4)] focus:outline-none font-sans leading-relaxed"
                            style={{ color: 'var(--text-1)', minHeight: 36, maxHeight: 260 }}
                            rows={1}
                        />
                    )}

                    {/* Bottom toolbar */}
                    <div className="flex items-center justify-between px-2.5 py-1.5"
                        style={{ borderTop: '1px solid var(--glass-border)' }}>
                        <div className="flex items-center gap-0.5">
                            <button
                                onClick={togglePasteCodeMode}
                                className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-sm
                           transition-all duration-150"
                                style={{
                                    background: pasteCodeMode ? 'hsla(258,80%,66%,0.12)' : 'transparent',
                                    color: pasteCodeMode ? 'var(--accent-1)' : 'var(--text-3)',
                                    border: pasteCodeMode ? '1px solid hsla(258,80%,66%,0.25)' : '1px solid transparent',
                                }}
                            >
                                <Code2 size={11} /> Code Mode
                            </button>
                            <button onClick={handleFileAttach}
                                className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-sm
                           transition-all duration-150 hover:bg-[hsl(var(--bg-glass-hover)/0.5)]"
                                style={{ color: 'var(--text-3)' }}>
                                <Paperclip size={11} /> Attach
                            </button>
                            <span className="text-[9px] font-mono ml-1.5" style={{ color: 'var(--text-4)' }}>
                                {lineCount}L · {charCount}C
                            </span>
                        </div>

                        {isStreaming ? (
                            <button onClick={stop}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-sm
                           transition-all duration-150"
                                style={{
                                    background: 'hsla(0,80%,60%,0.1)', color: 'var(--error)',
                                    border: '1px solid hsla(0,80%,60%,0.2)',
                                }}>
                                <Square size={11} /> Stop
                            </button>
                        ) : (
                            <button onClick={handleSend}
                                disabled={!input.trim() && attachedFiles.length === 0}
                                className="flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold text-white
                           rounded-sm transition-all duration-200 disabled:opacity-25 disabled:cursor-not-allowed
                           glow-accent"
                                style={{ background: 'var(--gradient-main)' }}>
                                <Send size={11} /> Send
                            </button>
                        )}
                    </div>
                </div>

                {/* Model selector row — below the input box */}
                <div className="flex items-center justify-between mt-1.5">
                    <div className="relative">
                        <button
                            onClick={() => setModelDropdownOpen((v) => !v)}
                            className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium rounded-sm
                         glass-subtle hover:border-[var(--glass-border-hover)] transition-all duration-200"
                        >
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-1)' }} />
                            <span style={{ color: 'var(--text-1)' }}>{currentModel.label}</span>
                            <span style={{ color: 'var(--text-3)' }}>· {currentModel.description}</span>
                            <ChevronDown size={10}
                                className={`transition-transform duration-200 ${modelDropdownOpen ? 'rotate-180' : ''}`}
                                style={{ color: 'var(--text-3)' }}
                            />
                        </button>

                        <AnimatePresence>
                            {modelDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 4, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 4, scale: 0.96 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute bottom-full left-0 mb-1.5 z-50 glass-strong rounded-sm overflow-hidden min-w-[200px]"
                                >
                                    {MODELS.map((model) => (
                                        <button
                                            key={model.id}
                                            onClick={() => { setSelectedModel(model.id); setModelDropdownOpen(false); }}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-[10px]
                                 hover:bg-[hsl(var(--bg-glass-hover)/0.5)] transition-colors ${selectedModel === model.id ? 'bg-[var(--accent-1)]/8' : ''
                                                }`}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full transition-colors ${selectedModel === model.id ? 'bg-[var(--accent-1)]' : 'bg-[var(--text-4)]'
                                                }`} />
                                            <div>
                                                <div style={{ color: 'var(--text-1)' }} className="font-medium">{model.label}</div>
                                                <div style={{ color: 'var(--text-3)' }} className="text-[9px]">{model.description}</div>
                                            </div>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-4 text-[8px]" style={{ color: 'var(--text-4)' }}>
                        <span><kbd className="font-mono">Enter</kbd> Send</span>
                        <span><kbd className="font-mono">Shift+Enter</kbd> New line</span>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default InputBox;
