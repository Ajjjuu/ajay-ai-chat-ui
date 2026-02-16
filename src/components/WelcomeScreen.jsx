/**
 * WelcomeScreen — Renamed to Hitler AI with updated branding.
 */
import { memo } from 'react';
import { motion } from 'framer-motion';
import { Bug, RefreshCw, FileSearch, Zap, Code2, Sparkles, ArrowRight } from 'lucide-react';
import { useChat } from '../hooks/useChat';

const suggestions = [
    {
        icon: Bug, label: 'Find & fix bugs',
        prompt: 'I have a bug in my code. Here\'s the relevant code:\n\n```\n// Paste your code here\n```\n\nThe issue is:',
        gradient: 'linear-gradient(135deg, #f87171 0%, #fb923c 100%)',
    },
    {
        icon: RefreshCw, label: 'Refactor code',
        prompt: 'Please refactor this code for better readability and maintainability:\n\n```\n// Paste your code here\n```',
        gradient: 'linear-gradient(135deg, #a78bfa 0%, #818cf8 100%)',
    },
    {
        icon: FileSearch, label: 'Explain code',
        prompt: 'Explain this code in detail:\n\n```\n// Paste your code here\n```',
        gradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    },
    {
        icon: Zap, label: 'Optimize performance',
        prompt: 'Optimize this code for better performance:\n\n```\n// Paste your code here\n```',
        gradient: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
    },
];

const capabilities = [
    { icon: Code2, text: 'Handles 1000s of lines' },
    { icon: Sparkles, text: 'Multiple AI models' },
    { icon: Bug, text: 'Smart bug detection' },
    { icon: RefreshCw, text: 'Refactoring suggestions' },
];

const WelcomeScreen = memo(function WelcomeScreen() {
    const { send } = useChat();

    return (
        <div className="flex-1 flex items-center justify-center p-6 md:p-10">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-xl w-full"
            >
                {/* Logo */}
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                        className="inline-flex items-center justify-center w-14 h-14 rounded-sm mb-5 animate-float glow-accent"
                        style={{ background: 'var(--gradient-main)' }}
                    >
                        <Sparkles size={24} className="text-white" />
                    </motion.div>
                    <h1 className="text-2xl font-bold mb-2 tracking-tight gradient-text">
                        Welcome to Hitler AI
                    </h1>
                    <p className="text-[12px] max-w-sm mx-auto leading-relaxed" style={{ color: 'var(--text-2)' }}>
                        Your AI-powered coding assistant. Paste code, get instant bug fixes,
                        refactoring suggestions, and explanations.
                    </p>
                </div>

                {/* Quick actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-8">
                    {suggestions.map((s, i) => (
                        <motion.button
                            key={i}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                            onClick={() => send(s.prompt)}
                            className="group flex items-center gap-3 px-3.5 py-3 rounded-sm
                         glass glass-hover text-left transition-all duration-250"
                        >
                            <div className="shrink-0 w-8 h-8 rounded-sm flex items-center justify-center"
                                style={{ background: s.gradient }}>
                                <s.icon size={14} className="text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-semibold" style={{ color: 'var(--text-1)' }}>{s.label}</div>
                                <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-3)' }}>
                                    Click to start with a template
                                </div>
                            </div>
                            <ArrowRight size={12}
                                className="shrink-0 transition-all duration-200 transform group-hover:translate-x-0.5"
                                style={{ color: 'var(--text-4)' }}
                            />
                        </motion.button>
                    ))}
                </div>

                {/* Capabilities */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center justify-center gap-5 flex-wrap"
                >
                    {capabilities.map((cap, i) => (
                        <div key={i} className="flex items-center gap-1 text-[9px]" style={{ color: 'var(--text-2)' }}>
                            <cap.icon size={10} />
                            {cap.text}
                        </div>
                    ))}
                </motion.div>
            </motion.div>
        </div>
    );
});

export default WelcomeScreen;
