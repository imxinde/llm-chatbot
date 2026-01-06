import { API_ENDPOINTS, SSE_MARKERS } from '@app/shared';

/**
 * API Client for LLM Chatbot
 * Based on OpenAPI specification
 */

const BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Send chat message and receive streaming response
 * @param {Object} params
 * @param {Array} params.messages - Array of message objects
 * @param {string} [params.model] - Model ID
 * @param {AbortSignal} [params.signal] - AbortController signal
 * @param {Function} params.onChunk - Callback for each content chunk
 * @param {Function} [params.onError] - Callback for errors
 * @param {Function} [params.onDone] - Callback when stream is complete
 */
export async function sendChatMessage({ messages, model, signal, onChunk, onError, onDone }) {
  try {
    const response = await fetch(`${BASE_URL}${API_ENDPOINTS.CHAT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages, model }),
      signal
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith(SSE_MARKERS.DATA_PREFIX)) {
          const data = line.slice(SSE_MARKERS.DATA_PREFIX.length);
          
          if (data === SSE_MARKERS.DONE) {
            onDone?.();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              onChunk(parsed.content);
            }
            if (parsed.error) {
              onError?.(new Error(parsed.error));
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    onDone?.();
  } catch (error) {
    if (error.name === 'AbortError') {
      return; // Request was cancelled
    }
    onError?.(error);
  }
}

/**
 * Get available models
 * @returns {Promise<Array>} Array of model objects
 */
export async function getModels() {
  const response = await fetch(`${BASE_URL}${API_ENDPOINTS.MODELS}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.models;
}
