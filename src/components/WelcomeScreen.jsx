import { memo } from 'react';
import { motion } from 'framer-motion';
import { Bot, Code2, Sparkles, Wand2 } from 'lucide-react';

const items = [
  { icon: Code2, label: 'Code generation and refactoring' },
  { icon: Sparkles, label: 'Fast model switching' },
  { icon: Wand2, label: 'Readable, structured answers' },
];

const WelcomeScreen = memo(function WelcomeScreen() {
  return (
    <section className="flex h-full w-full items-center justify-center overflow-y-auto px-4 py-10 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="chat-panel w-full max-w-3xl p-6 md:p-8"
        style={{ background: 'var(--surface-frost)' }}
      >
        <div className="mb-6 flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <Bot size={24} strokeWidth={1.5} />
          </div>
          <div>
            <h1>Ajjjuu AI Assistant</h1>
            <p className="text-small" style={{ color: 'var(--text-secondary)' }}>
              Start with a question, code snippet, or file.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {items.map(({ icon: Icon, label }) => (
            <article
              key={label}
              className="rounded-xl border p-4"
              style={{ borderColor: 'var(--divider)', background: 'var(--bg-secondary)' }}
            >
              <Icon size={20} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
              <p className="mt-2 text-[14px]" style={{ color: 'var(--text-primary)' }}>
                {label}
              </p>
            </article>
          ))}
        </div>
      </motion.div>
    </section>
  );
});

export default WelcomeScreen;
