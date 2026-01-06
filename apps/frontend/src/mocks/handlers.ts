import { http, HttpResponse } from 'msw';

const API_BASE = 'http://localhost:3000';

// Mock model data
export const mockModels = [
  {
    id: 'openai/gpt-4',
    name: 'GPT-4',
    description: 'OpenAI GPT-4 model',
    context_length: 8192,
  },
  {
    id: 'anthropic/claude-3',
    name: 'Claude 3',
    description: 'Anthropic Claude 3 model',
    context_length: 100000,
  },
  {
    id: 'google/gemini-pro',
    name: 'Gemini Pro',
    description: 'Google Gemini Pro model',
    context_length: 32000,
  },
];

// Mock SSE stream helper
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

export const handlers = [
  // GET /api/models
  http.get(`${API_BASE}/api/models`, () => {
    return HttpResponse.json({ models: mockModels });
  }),

  // POST /api/chat (SSE stream)
  http.post(`${API_BASE}/api/chat`, async ({ request }) => {
    const body = (await request.json()) as { messages?: unknown[]; model?: string };

    // Validate request
    if (!body.messages || !Array.isArray(body.messages)) {
      return HttpResponse.json({ error: 'Invalid request: messages required' }, { status: 400 });
    }

    // Create SSE response
    const chunks = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" from"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" mock!"}}]}\n\n',
      'data: [DONE]\n\n',
    ];

    return new HttpResponse(createSSEStream(chunks), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }),
];

// Error handlers for testing error scenarios
export const errorHandlers = {
  modelsError: http.get(`${API_BASE}/api/models`, () => {
    return HttpResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }),

  chatError: http.post(`${API_BASE}/api/chat`, () => {
    return HttpResponse.json({ error: 'Chat service unavailable' }, { status: 503 });
  }),

  chatStreamError: http.post(`${API_BASE}/api/chat`, () => {
    const chunks = ['data: {"error":{"message":"Stream error occurred"}}\n\n'];
    return new HttpResponse(createSSEStream(chunks), {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }),
};
