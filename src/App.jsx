/**
 * App — Root component that sets up:
 *  - Global keyboard shortcuts
 *  - Main layout
 *  - Error boundaries (future)
 */
import ChatLayout from './components/ChatLayout';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

export default function App() {
  // Register global keyboard shortcuts
  useKeyboardShortcuts();

  return <ChatLayout />;
}
