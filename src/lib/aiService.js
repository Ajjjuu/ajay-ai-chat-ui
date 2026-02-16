/**
 * AI service — modular wrapper around the Puter AI API.
 * 
 * This is the single point of contact with the AI backend.
 * Swap this file to change providers (OpenAI, local LLM, etc.).
 */

/**
 * Send a chat message and receive a complete response.
 * @param {string} prompt - The user's message
 * @param {object} options
 * @param {string} options.model - Model identifier
 * @param {Array}  options.history - Conversation history [{role, content}]
 * @returns {Promise<string>} The assistant's response text
 */
export async function sendMessage(prompt, { model = 'claude-haiku-4-5', history = [] } = {}) {
    // Guard: check puter is loaded
    if (typeof puter === 'undefined' || !puter?.ai?.chat) {
        throw new Error('Puter SDK is not loaded. Make sure the script tag is in index.html.');
    }

    // Build messages array for context
    const messages = [
        ...history.map((m) => ({
            role: m.role,
            content: m.content,
        })),
        { role: 'user', content: prompt },
    ];

    try {
        const response = await puter.ai.chat(messages, { model, stream: true });
        return response;
    } catch (err) {
        console.error('[AI Service] Error:', err);
        throw err;
    }
}

/**
 * Send a chat message with streaming support.
 * Yields tokens one at a time.
 * @param {string} prompt
 * @param {object} options
 * @returns {AsyncGenerator<string>} Yields text chunks
 */
export async function* streamMessage(prompt, { model = 'claude-haiku-4-5', history = [] } = {}) {
    if (typeof puter === 'undefined' || !puter?.ai?.chat) {
        throw new Error('Puter SDK is not loaded.');
    }

    const messages = [
        ...history.map((m) => ({
            role: m.role,
            content: m.content,
        })),
        { role: 'user', content: prompt },
    ];

    try {
        const response = await puter.ai.chat(messages, { model, stream: true });

        // Handle streaming response
        if (response && typeof response[Symbol.asyncIterator] === 'function') {
            for await (const chunk of response) {
                if (chunk?.text) {
                    yield chunk.text;
                }
            }
        } else if (response?.message?.content) {
            // Fallback: non-streaming response, simulate streaming
            const text = Array.isArray(response.message.content)
                ? response.message.content.map(c => c.text || '').join('')
                : response.message.content;

            // Simulate token-by-token streaming for smooth UX
            const words = text.split(/(\s+)/);
            for (const word of words) {
                yield word;
                await new Promise((r) => setTimeout(r, 15));
            }
        }
    } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('[AI Service] Stream error:', err);
        throw err;
    }
}
