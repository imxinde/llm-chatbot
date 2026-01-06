import {
  API_ENDPOINTS,
  SSE_MARKERS,
  type Message,
  type Model,
  type ModelsResponse,
  type ErrorResponse,
} from '@app/shared';

const BASE_URL: string = import.meta.env.VITE_API_URL ?? '';

/**
 * Options for sending chat message
 */
interface SendChatMessageOptions {
  messages: Message[];
  model?: string;
  signal?: AbortSignal;
  onChunk: (content: string) => void;
  onError?: (error: Error) => void;
  onDone?: () => void;
}

/**
 * SSE response chunk structure
 */
interface SSEResponseChunk {
  content?: string;
  error?: string;
}

/**
 * Send chat message and receive streaming response
 */
export async function sendChatMessage({
  messages,
  model,
  signal,
  onChunk,
  onError,
  onDone,
}: SendChatMessageOptions): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}${API_ENDPOINTS.CHAT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        model,
      }),
      signal,
    });

    if (!response.ok) {
      const error = (await response
        .json()
        .catch((): ErrorResponse => ({ error: 'Request failed' }))) as ErrorResponse;
      throw new Error(error.error ?? `HTTP ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let reading = true;
    while (reading) {
      const { done, value } = await reader.read();
      if (done) {
        reading = false;
        break;
      }

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
            const parsed = JSON.parse(data) as SSEResponseChunk;
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
    if (error instanceof Error && error.name === 'AbortError') {
      return; // Request was cancelled
    }
    if (error instanceof Error) {
      onError?.(error);
    } else {
      onError?.(new Error('Unknown error'));
    }
  }
}

/**
 * Get available models
 * @returns Array of model objects
 */
export async function getModels(): Promise<Model[]> {
  const response = await fetch(`${BASE_URL}${API_ENDPOINTS.MODELS}`);

  if (!response.ok) {
    const error = (await response
      .json()
      .catch((): ErrorResponse => ({ error: 'Request failed' }))) as ErrorResponse;
    throw new Error(error.error ?? `HTTP ${response.status}`);
  }

  const data = (await response.json()) as ModelsResponse;
  return data.models;
}
