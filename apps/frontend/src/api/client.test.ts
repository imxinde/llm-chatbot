import { describe, it, expect, vi, beforeEach } from 'vitest';
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';
import { sendChatMessage, getModels } from './client';

const API_BASE = 'http://localhost:3000';

// Type for mock error
interface MockError {
  message: string;
}

// Helper to create SSE stream
function createSSEStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  let index = 0;

  return new ReadableStream({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(encoder.encode(chunks[index]));
        index++;
      } else {
        controller.close();
      }
    },
  });
}

describe('API Client', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_URL', API_BASE);
  });

  describe('sendChatMessage', () => {
    describe('Successful Streaming', () => {
      it('should call onChunk for each content chunk', async () => {
        server.use(
          http.post(`${API_BASE}/api/chat`, () => {
            const stream = createSSEStream([
              'data: {"content":"Hello"}\n\n',
              'data: {"content":" World"}\n\n',
              'data: [DONE]\n\n',
            ]);
            return new HttpResponse(stream, {
              headers: { 'Content-Type': 'text/event-stream' },
            });
          })
        );

        const onChunk = vi.fn();
        const onDone = vi.fn();

        await sendChatMessage({
          messages: [{ role: 'user', content: 'Hi', id: '1' }],
          onChunk,
          onDone,
        });

        expect(onChunk).toHaveBeenCalledWith('Hello');
        expect(onChunk).toHaveBeenCalledWith(' World');
        expect(onDone).toHaveBeenCalled();
      });

      it('should call onDone when stream completes', async () => {
        server.use(
          http.post(`${API_BASE}/api/chat`, () => {
            const stream = createSSEStream(['data: [DONE]\n\n']);
            return new HttpResponse(stream, {
              headers: { 'Content-Type': 'text/event-stream' },
            });
          })
        );

        const onDone = vi.fn();

        await sendChatMessage({
          messages: [{ role: 'user', content: 'Hi', id: '1' }],
          onChunk: vi.fn(),
          onDone,
        });

        expect(onDone).toHaveBeenCalledTimes(1);
      });

      it('should pass model parameter to request', async () => {
        let capturedBody: { model?: string } | undefined;

        server.use(
          http.post(`${API_BASE}/api/chat`, async ({ request }) => {
            capturedBody = (await request.json()) as { model?: string };
            const stream = createSSEStream(['data: [DONE]\n\n']);
            return new HttpResponse(stream, {
              headers: { 'Content-Type': 'text/event-stream' },
            });
          })
        );

        await sendChatMessage({
          messages: [{ role: 'user', content: 'Hi', id: '1' }],
          model: 'gpt-4',
          onChunk: vi.fn(),
        });

        expect(capturedBody).toBeDefined();
        expect(capturedBody?.model).toBe('gpt-4');
      });

      it('should strip extra properties from messages', async () => {
        let capturedBody: { messages?: { role: string; content: string }[] } | undefined;

        server.use(
          http.post(`${API_BASE}/api/chat`, async ({ request }) => {
            capturedBody = (await request.json()) as {
              messages?: { role: string; content: string }[];
            };
            const stream = createSSEStream(['data: [DONE]\n\n']);
            return new HttpResponse(stream, {
              headers: { 'Content-Type': 'text/event-stream' },
            });
          })
        );

        await sendChatMessage({
          messages: [{ role: 'user', content: 'Hi', id: '1' }],
          onChunk: vi.fn(),
        });

        expect(capturedBody).toBeDefined();
        const firstMessage = capturedBody?.messages?.[0];
        expect(firstMessage).toEqual({ role: 'user', content: 'Hi' });
        expect(firstMessage).not.toHaveProperty('id');
        expect(firstMessage).not.toHaveProperty('isStreaming');
      });
    });

    describe('Error Handling', () => {
      it('should call onError when HTTP error occurs', async () => {
        server.use(
          http.post(`${API_BASE}/api/chat`, () => {
            return HttpResponse.json({ error: 'Server error' }, { status: 500 });
          })
        );

        const onError = vi.fn();

        await sendChatMessage({
          messages: [{ role: 'user', content: 'Hi', id: '1' }],
          onChunk: vi.fn(),
          onError,
        });

        expect(onError).toHaveBeenCalledWith(expect.any(Error));
        expect((onError.mock.calls[0]?.[0] as MockError).message).toBe('Server error');
      });

      it('should call onError when stream contains error', async () => {
        server.use(
          http.post(`${API_BASE}/api/chat`, () => {
            const stream = createSSEStream(['data: {"error":"Stream error"}\n\n']);
            return new HttpResponse(stream, {
              headers: { 'Content-Type': 'text/event-stream' },
            });
          })
        );

        const onError = vi.fn();

        await sendChatMessage({
          messages: [{ role: 'user', content: 'Hi', id: '1' }],
          onChunk: vi.fn(),
          onError,
        });

        expect(onError).toHaveBeenCalledWith(expect.any(Error));
        expect((onError.mock.calls[0]?.[0] as MockError).message).toBe('Stream error');
      });

      it('should call onError when response body is null', async () => {
        server.use(
          http.post(`${API_BASE}/api/chat`, () => {
            return new HttpResponse(null, { status: 200 });
          })
        );

        const onError = vi.fn();

        await sendChatMessage({
          messages: [{ role: 'user', content: 'Hi', id: '1' }],
          onChunk: vi.fn(),
          onError,
        });

        expect(onError).toHaveBeenCalledWith(expect.any(Error));
        expect((onError.mock.calls[0]?.[0] as MockError).message).toBe('Response body is null');
      });

      it('should not call onError when request is aborted', async () => {
        const controller = new AbortController();

        server.use(
          http.post(`${API_BASE}/api/chat`, async () => {
            // Abort before response
            controller.abort();
            await new Promise((resolve) => setTimeout(resolve, 100));
            const stream = createSSEStream(['data: [DONE]\n\n']);
            return new HttpResponse(stream, {
              headers: { 'Content-Type': 'text/event-stream' },
            });
          })
        );

        const onError = vi.fn();

        await sendChatMessage({
          messages: [{ role: 'user', content: 'Hi', id: '1' }],
          signal: controller.signal,
          onChunk: vi.fn(),
          onError,
        });

        expect(onError).not.toHaveBeenCalled();
      });

      it('should use fallback error message when JSON parse fails', async () => {
        server.use(
          http.post(`${API_BASE}/api/chat`, () => {
            return new HttpResponse('Not JSON', { status: 500 });
          })
        );

        const onError = vi.fn();

        await sendChatMessage({
          messages: [{ role: 'user', content: 'Hi', id: '1' }],
          onChunk: vi.fn(),
          onError,
        });

        expect(onError).toHaveBeenCalledWith(expect.any(Error));
        expect((onError.mock.calls[0]?.[0] as MockError).message).toBe('Request failed');
      });
    });

    describe('Edge Cases', () => {
      it('should skip invalid JSON in stream', async () => {
        server.use(
          http.post(`${API_BASE}/api/chat`, () => {
            const stream = createSSEStream([
              'data: invalid json\n\n',
              'data: {"content":"Valid"}\n\n',
              'data: [DONE]\n\n',
            ]);
            return new HttpResponse(stream, {
              headers: { 'Content-Type': 'text/event-stream' },
            });
          })
        );

        const onChunk = vi.fn();

        await sendChatMessage({
          messages: [{ role: 'user', content: 'Hi', id: '1' }],
          onChunk,
        });

        expect(onChunk).toHaveBeenCalledTimes(1);
        expect(onChunk).toHaveBeenCalledWith('Valid');
      });

      it('should skip chunks without content', async () => {
        server.use(
          http.post(`${API_BASE}/api/chat`, () => {
            const stream = createSSEStream([
              'data: {}\n\n',
              'data: {"content":"Has content"}\n\n',
              'data: [DONE]\n\n',
            ]);
            return new HttpResponse(stream, {
              headers: { 'Content-Type': 'text/event-stream' },
            });
          })
        );

        const onChunk = vi.fn();

        await sendChatMessage({
          messages: [{ role: 'user', content: 'Hi', id: '1' }],
          onChunk,
        });

        expect(onChunk).toHaveBeenCalledTimes(1);
        expect(onChunk).toHaveBeenCalledWith('Has content');
      });

      it('should call onDone when stream ends without [DONE] marker', async () => {
        server.use(
          http.post(`${API_BASE}/api/chat`, () => {
            const stream = createSSEStream(['data: {"content":"Hello"}\n\n']);
            return new HttpResponse(stream, {
              headers: { 'Content-Type': 'text/event-stream' },
            });
          })
        );

        const onDone = vi.fn();

        await sendChatMessage({
          messages: [{ role: 'user', content: 'Hi', id: '1' }],
          onChunk: vi.fn(),
          onDone,
        });

        expect(onDone).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('getModels', () => {
    describe('Successful Response', () => {
      it('should return models array', async () => {
        const mockModels = [
          { id: 'gpt-4', name: 'GPT-4', context_length: 8192 },
          { id: 'claude-3', name: 'Claude 3', context_length: 100000 },
        ];

        server.use(
          http.get(`${API_BASE}/api/models`, () => {
            return HttpResponse.json({ models: mockModels });
          })
        );

        const models = await getModels();

        expect(models).toEqual(mockModels);
      });

      it('should return empty array when no models', async () => {
        server.use(
          http.get(`${API_BASE}/api/models`, () => {
            return HttpResponse.json({ models: [] });
          })
        );

        const models = await getModels();

        expect(models).toEqual([]);
      });
    });

    describe('Error Handling', () => {
      it('should throw error on HTTP error', async () => {
        server.use(
          http.get(`${API_BASE}/api/models`, () => {
            return HttpResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
          })
        );

        await expect(getModels()).rejects.toThrow('Failed to fetch models');
      });

      it('should use fallback error message when JSON parse fails', async () => {
        server.use(
          http.get(`${API_BASE}/api/models`, () => {
            return new HttpResponse('Not JSON', { status: 500 });
          })
        );

        await expect(getModels()).rejects.toThrow('Request failed');
      });

      it('should use HTTP status when no error message', async () => {
        server.use(
          http.get(`${API_BASE}/api/models`, () => {
            return HttpResponse.json({}, { status: 503 });
          })
        );

        await expect(getModels()).rejects.toThrow('HTTP 503');
      });
    });
  });
});
