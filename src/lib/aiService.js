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
 * Yields tokens one at a time, with extended thinking support.
 * @param {string} prompt
 * @param {object} options
 * @returns {AsyncGenerator<string>} Yields text chunks and thinking content
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
        // Enable extended thinking for Claude models
        const apiOptions = {
            model,
            stream: true,
            ...(model.includes('claude') && {
                extended_thinking: true,
                budget_tokens: 10000,
            }),
        };

        const response = await puter.ai.chat(messages, apiOptions);

        // Handle streaming response
        if (response && typeof response[Symbol.asyncIterator] === 'function') {
            for await (const chunk of response) {
                // Handle thinking blocks (extended thinking)
                if (chunk?.type === 'thinking' && chunk?.thinking) {
                    yield { thinking: chunk.thinking };
                    continue; // Don't process as text
                }

                // Handle text blocks
                if (chunk?.type === 'text' && chunk?.text) {
                    yield { text: chunk.text };
                    continue; // Don't process fallback
                }

                // Fallback for older response formats (when type is not set)
                if (chunk?.text) {
                    yield { text: chunk.text };
                } else if (chunk?.reasoning || chunk?.thinking || chunk?.reasoning_content) {
                    const reasoning = chunk.reasoning || chunk.thinking || chunk.reasoning_content;
                    yield { reasoning };
                }
            }
        } else if (response?.message?.content) {
            // Fallback: non-streaming response, parse content blocks
            const contentBlocks = Array.isArray(response.message.content)
                ? response.message.content
                : [response.message.content];

            // Extract and yield thinking blocks first
            for (const block of contentBlocks) {
                if (block?.type === 'thinking' && block?.thinking) {
                    yield { thinking: block.thinking };
                }
            }

            // Extract and stream text blocks
            const textContent = contentBlocks
                .filter((b) => b?.type === 'text' || typeof b === 'string')
                .map((b) => (typeof b === 'string' ? b : b?.text || ''))
                .join('');

            if (!textContent && response.message?.reasoning) {
                yield { reasoning: response.message.reasoning };
            }

            // Simulate token-by-token streaming for smooth UX
            const words = textContent.split(/(\s+)/);
            for (const word of words) {
                yield { text: word };
                await new Promise((r) => setTimeout(r, 15));
            }
        }
    } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('[AI Service] Stream error:', err);
        throw err;
    }
}
