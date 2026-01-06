import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DEFAULTS } from '@app/shared';

// Store original env
const originalEnv = process.env;

// Define types for mock fetch
interface MockRequestInit {
  method: string;
  headers: Record<string, string>;
  body: string;
}

// Mock fetch globally
const mockFetch = vi.fn<(url: string, init: MockRequestInit) => Promise<Response>>();
vi.stubGlobal('fetch', mockFetch);

describe('OpenRouterService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset modules to get fresh instance
    vi.resetModules();
    // Set test API key
    process.env = { ...originalEnv, OPENROUTER_API_KEY: 'test-api-key' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('chat()', () => {
    it('should send correct request and return response', async () => {
      const mockResponse = {
        id: 'test-id',
        choices: [{ message: { content: 'Hello!' } }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as unknown as Response);

      const { default: openRouterService } = await import('./openrouter.js');

      const messages = [{ role: 'user' as const, content: 'Hi' }];
      const result = await openRouterService.chat(messages);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }) as Record<string, string>,
          body: expect.stringContaining('"stream":false') as string,
        })
      );

      expect(result).toEqual(mockResponse);
    });

    it('should use default model when not specified', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'test' }),
      } as unknown as Response);

      const { default: openRouterService } = await import('./openrouter.js');

      await openRouterService.chat([{ role: 'user' as const, content: 'Hi' }]);

      const mockCalls = mockFetch.mock.calls as [string, MockRequestInit][];
      const firstCall = mockCalls[0];
      if (!firstCall) throw new Error('No fetch call recorded');
      const requestBody = firstCall[1].body;
      const callBody = JSON.parse(requestBody) as { model: string };
      expect(callBody.model).toBe(DEFAULTS.MODEL);
    });

    it('should throw error when API returns error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: 'Unauthorized' } }),
      } as unknown as Response);

      const { default: openRouterService } = await import('./openrouter.js');

      await expect(
        openRouterService.chat([{ role: 'user' as const, content: 'Hi' }])
      ).rejects.toThrow('Unauthorized');
    });

    it('should throw generic error when API error has no message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      } as unknown as Response);

      const { default: openRouterService } = await import('./openrouter.js');

      await expect(
        openRouterService.chat([{ role: 'user' as const, content: 'Hi' }])
      ).rejects.toThrow('API error: 500');
    });
  });

  describe('streamChat()', () => {
    it('should return ReadableStream on success', async () => {
      const mockStream = new ReadableStream();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: mockStream,
      } as unknown as Response);

      const { default: openRouterService } = await import('./openrouter.js');

      const result = await openRouterService.streamChat([{ role: 'user' as const, content: 'Hi' }]);

      expect(result).toBe(mockStream);
    });

    it('should send stream:true in request body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: new ReadableStream(),
      } as unknown as Response);

      const { default: openRouterService } = await import('./openrouter.js');

      await openRouterService.streamChat([{ role: 'user' as const, content: 'Hi' }]);

      const mockCalls = mockFetch.mock.calls as [string, MockRequestInit][];
      const firstCall = mockCalls[0];
      if (!firstCall) throw new Error('No fetch call recorded');
      const requestBody = firstCall[1].body;
      const callBody = JSON.parse(requestBody) as { stream: boolean };
      expect(callBody.stream).toBe(true);
    });

    it('should throw error when response body is null', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        body: null,
      } as unknown as Response);

      const { default: openRouterService } = await import('./openrouter.js');

      await expect(
        openRouterService.streamChat([{ role: 'user' as const, content: 'Hi' }])
      ).rejects.toThrow('Response body is null');
    });

    it('should throw error when API returns error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: { message: 'Rate limited' } }),
      } as unknown as Response);

      const { default: openRouterService } = await import('./openrouter.js');

      await expect(
        openRouterService.streamChat([{ role: 'user' as const, content: 'Hi' }])
      ).rejects.toThrow('Rate limited');
    });
  });

  describe('getModels()', () => {
    it('should return formatted model list', async () => {
      const mockModelsResponse = {
        data: [
          {
            id: 'openai/gpt-4',
            name: 'GPT-4',
            description: 'OpenAI GPT-4',
            context_length: 8192,
          },
          {
            id: 'anthropic/claude-3',
            name: null,
            description: null,
            context_length: null,
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockModelsResponse),
      } as unknown as Response);

      const { default: openRouterService } = await import('./openrouter.js');

      const models = await openRouterService.getModels();

      expect(models).toHaveLength(2);
      expect(models[0]).toEqual({
        id: 'openai/gpt-4',
        name: 'GPT-4',
        description: 'OpenAI GPT-4',
        context_length: 8192,
      });
      // When name is null, should use last part of id
      const secondModel = models[1];
      if (!secondModel) throw new Error('Second model not found');
      expect(secondModel.name).toBe('claude-3');
      // When context_length is null, should default to 4096
      expect(secondModel.context_length).toBe(4096);
    });

    it('should limit to 50 models', async () => {
      const manyModels = Array.from({ length: 100 }, (_, i) => ({
        id: `model-${i}`,
        name: `Model ${i}`,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: manyModels }),
      } as unknown as Response);

      const { default: openRouterService } = await import('./openrouter.js');

      const models = await openRouterService.getModels();

      expect(models).toHaveLength(50);
    });

    it('should throw error when API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
      } as unknown as Response);

      const { default: openRouterService } = await import('./openrouter.js');

      await expect(openRouterService.getModels()).rejects.toThrow('Failed to fetch models: 503');
    });
  });
});
