import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express, { type Express } from 'express';
import request from 'supertest';

// Store original env
const originalEnv = process.env;

// Type for response body
interface ErrorResponse {
  error?: string;
}

interface ModelsResponse {
  models?: unknown[];
  error?: string;
}

// Mock openRouterService
const mockStreamChat = vi.fn();
const mockGetModels = vi.fn();

vi.mock('../services/openrouter.js', () => ({
  default: {
    streamChat: (...args: unknown[]): unknown => mockStreamChat(...args),
    getModels: (): unknown => mockGetModels(),
  },
}));

// Helper to create a mock ReadableStream
function createMockStream(chunks: string[]): ReadableStream<Uint8Array> {
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

describe('Chat Routes', () => {
  let app: Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = { ...originalEnv };

    // Create fresh Express app for each test
    app = express();
    app.use(express.json());

    // Import router after mocks are set up
    const { default: chatRouter } = await import('./chat.js');
    app.use('/api', chatRouter);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('POST /api/chat', () => {
    describe('Request Validation', () => {
      it('should return 400 when request body is empty', async () => {
        const response = await request(app).post('/api/chat').send({});

        expect(response.status).toBe(400);
        expect((response.body as ErrorResponse).error).toContain('Messages array is required');
      });

      it('should return 400 when messages is not an array', async () => {
        const response = await request(app).post('/api/chat').send({ messages: 'not an array' });

        expect(response.status).toBe(400);
        expect((response.body as ErrorResponse).error).toContain('Messages array is required');
      });

      it('should return 400 when messages array is empty', async () => {
        const response = await request(app).post('/api/chat').send({ messages: [] });

        expect(response.status).toBe(400);
        expect((response.body as ErrorResponse).error).toContain('Messages array is required');
      });

      it('should return 400 when message has invalid role', async () => {
        const response = await request(app)
          .post('/api/chat')
          .send({ messages: [{ role: 'invalid', content: 'test' }] });

        expect(response.status).toBe(400);
        expect((response.body as ErrorResponse).error).toContain('Invalid message role');
      });

      it('should return 400 when message content is not a string', async () => {
        const response = await request(app)
          .post('/api/chat')
          .send({ messages: [{ role: 'user', content: 123 }] });

        expect(response.status).toBe(400);
        expect((response.body as ErrorResponse).error).toContain(
          'Message content must be a string'
        );
      });

      it('should return 400 when message is not an object', async () => {
        const response = await request(app)
          .post('/api/chat')
          .send({ messages: ['not an object'] });

        expect(response.status).toBe(400);
        expect((response.body as ErrorResponse).error).toContain('Each message must be an object');
      });

      it('should return 400 when model is not a string', async () => {
        const response = await request(app)
          .post('/api/chat')
          .send({ messages: [{ role: 'user', content: 'test' }], model: 123 });

        expect(response.status).toBe(400);
        expect((response.body as ErrorResponse).error).toContain('Model must be a string');
      });
    });

    describe('Successful Streaming', () => {
      it('should set correct SSE headers', async () => {
        const mockStream = createMockStream(['data: [DONE]\n\n']);
        mockStreamChat.mockResolvedValueOnce(mockStream);

        const response = await request(app)
          .post('/api/chat')
          .send({ messages: [{ role: 'user', content: 'Hello' }] });

        expect(response.headers['content-type']).toContain('text/event-stream');
        expect(response.headers['cache-control']).toBe('no-cache');
        expect(response.headers.connection).toBe('keep-alive');
      });

      it('should stream content chunks correctly', async () => {
        const mockStream = createMockStream([
          'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
          'data: {"choices":[{"delta":{"content":" World"}}]}\n\n',
          'data: [DONE]\n\n',
        ]);
        mockStreamChat.mockResolvedValueOnce(mockStream);

        const response = await request(app)
          .post('/api/chat')
          .send({ messages: [{ role: 'user', content: 'Hi' }] });

        expect(response.status).toBe(200);
        expect(response.text).toContain('data: {"content":"Hello"}');
        expect(response.text).toContain('data: {"content":" World"}');
        expect(response.text).toContain('data: [DONE]');
      });

      it('should pass messages and model to streamChat', async () => {
        const mockStream = createMockStream(['data: [DONE]\n\n']);
        mockStreamChat.mockResolvedValueOnce(mockStream);

        const messages = [{ role: 'user', content: 'Hello' }];
        const model = 'gpt-4';

        await request(app).post('/api/chat').send({ messages, model });

        expect(mockStreamChat).toHaveBeenCalledWith(messages, model);
      });

      it('should handle valid roles: user, assistant, system', async () => {
        const mockStream = createMockStream(['data: [DONE]\n\n']);
        mockStreamChat.mockResolvedValueOnce(mockStream);

        const messages = [
          { role: 'system', content: 'You are helpful' },
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there' },
          { role: 'user', content: 'How are you?' },
        ];

        const response = await request(app).post('/api/chat').send({ messages });

        expect(response.status).toBe(200);
        expect(mockStreamChat).toHaveBeenCalledWith(messages, undefined);
      });
    });

    describe('Edge Cases', () => {
      it('should skip invalid JSON in stream', async () => {
        const mockStream = createMockStream([
          'data: invalid json\n\n',
          'data: {"choices":[{"delta":{"content":"Valid"}}]}\n\n',
          'data: [DONE]\n\n',
        ]);
        mockStreamChat.mockResolvedValueOnce(mockStream);

        const response = await request(app)
          .post('/api/chat')
          .send({ messages: [{ role: 'user', content: 'Hi' }] });

        expect(response.status).toBe(200);
        expect(response.text).toContain('data: {"content":"Valid"}');
        expect(response.text).not.toContain('invalid json');
      });

      it('should skip chunks without content', async () => {
        const mockStream = createMockStream([
          'data: {"choices":[{"delta":{}}]}\n\n',
          'data: {"choices":[{"delta":{"content":"Has content"}}]}\n\n',
          'data: [DONE]\n\n',
        ]);
        mockStreamChat.mockResolvedValueOnce(mockStream);

        const response = await request(app)
          .post('/api/chat')
          .send({ messages: [{ role: 'user', content: 'Hi' }] });

        expect(response.status).toBe(200);
        expect(response.text).toContain('data: {"content":"Has content"}');
      });

      it('should handle empty lines in stream', async () => {
        const mockStream = createMockStream([
          '\n\n',
          'data: {"choices":[{"delta":{"content":"Content"}}]}\n\n',
          '\n',
          'data: [DONE]\n\n',
        ]);
        mockStreamChat.mockResolvedValueOnce(mockStream);

        const response = await request(app)
          .post('/api/chat')
          .send({ messages: [{ role: 'user', content: 'Hi' }] });

        expect(response.status).toBe(200);
        expect(response.text).toContain('data: {"content":"Content"}');
      });
    });

    describe('Error Handling', () => {
      let originalConsoleError: typeof console.error;

      beforeEach(() => {
        originalConsoleError = console.error;
        console.error = vi.fn();
      });

      afterEach(() => {
        console.error = originalConsoleError;
      });

      it('should handle streamChat error', async () => {
        mockStreamChat.mockRejectedValueOnce(new Error('Stream failed'));

        const response = await request(app)
          .post('/api/chat')
          .send({ messages: [{ role: 'user', content: 'Hi' }] });

        expect(response.status).toBe(200); // SSE always returns 200
        expect(response.text).toContain('data: {"error":"Stream failed"}');
      });

      it('should handle non-Error exceptions', async () => {
        mockStreamChat.mockRejectedValueOnce('String error');

        const response = await request(app)
          .post('/api/chat')
          .send({ messages: [{ role: 'user', content: 'Hi' }] });

        expect(response.status).toBe(200);
        expect(response.text).toContain('data: {"error":"Unknown error"}');
      });
    });
  });

  describe('GET /api/models', () => {
    describe('Successful Response', () => {
      it('should return models list', async () => {
        const mockModels = [
          { id: 'gpt-4', name: 'GPT-4', context_length: 8192 },
          { id: 'claude-3', name: 'Claude 3', context_length: 100000 },
        ];
        mockGetModels.mockResolvedValueOnce(mockModels);

        const response = await request(app).get('/api/models');

        expect(response.status).toBe(200);
        expect((response.body as ModelsResponse).models).toEqual(mockModels);
      });

      it('should return empty array when no models', async () => {
        mockGetModels.mockResolvedValueOnce([]);

        const response = await request(app).get('/api/models');

        expect(response.status).toBe(200);
        expect((response.body as ModelsResponse).models).toEqual([]);
      });
    });

    describe('Error Handling', () => {
      let originalConsoleError: typeof console.error;

      beforeEach(() => {
        originalConsoleError = console.error;
        console.error = vi.fn();
      });

      afterEach(() => {
        console.error = originalConsoleError;
      });

      it('should return 500 when getModels fails', async () => {
        mockGetModels.mockRejectedValueOnce(new Error('Failed to fetch models'));

        const response = await request(app).get('/api/models');

        expect(response.status).toBe(500);
        expect((response.body as ErrorResponse).error).toBe('Failed to fetch models');
      });

      it('should handle non-Error exceptions', async () => {
        mockGetModels.mockRejectedValueOnce('String error');

        const response = await request(app).get('/api/models');

        expect(response.status).toBe(500);
        expect((response.body as ErrorResponse).error).toBe('Unknown error');
      });
    });
  });
});
