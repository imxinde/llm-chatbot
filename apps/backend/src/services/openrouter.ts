import { DEFAULTS, Message, Model, ChatCompletionResponse, OpenRouterModelsResponse } from '@app/shared';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

/**
 * OpenRouter API error response structure
 */
interface OpenRouterError {
  error?: {
    message?: string;
    code?: string;
  };
}

/**
 * OpenRouter Service for interacting with LLM APIs
 */
class OpenRouterService {
  private readonly headers: Record<string, string>;

  constructor(apiKey: string) {
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'LLM ChatBot'
    };
  }

  /**
   * Stream chat completion
   * @param messages - Array of message objects
   * @param model - Model ID
   * @returns SSE stream body
   */
  async streamChat(messages: Message[], model: string = DEFAULTS.MODEL): Promise<ReadableStream<Uint8Array>> {
    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.json().catch((): OpenRouterError => ({})) as OpenRouterError;
      throw new Error(error.error?.message ?? `API error: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    return response.body;
  }

  /**
   * Non-streaming chat completion
   * @param messages - Array of message objects
   * @param model - Model ID
   * @returns Chat completion response
   */
  async chat(messages: Message[], model: string = DEFAULTS.MODEL): Promise<ChatCompletionResponse> {
    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.json().catch((): OpenRouterError => ({})) as OpenRouterError;
      throw new Error(error.error?.message ?? `API error: ${response.status}`);
    }

    return response.json() as Promise<ChatCompletionResponse>;
  }

  /**
   * Get available models
   * @returns Array of model objects
   */
  async getModels(): Promise<Model[]> {
    const response = await fetch(`${OPENROUTER_API_URL}/models`, {
      method: 'GET',
      headers: this.headers
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data = await response.json() as OpenRouterModelsResponse;
    
    // Format and limit models
    return data.data
      .slice(0, 50)
      .map((model): Model => ({
        id: model.id,
        name: model.name || model.id.split('/').pop() || model.id,
        description: model.description ?? '',
        context_length: model.context_length ?? 4096
      }));
  }
}

// Validate API key on startup
if (!process.env.OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY is not set in environment variables');
  console.error('   Please create a .env file with your API key');
  console.error('   See .env.example for reference');
}

const openRouterService = new OpenRouterService(process.env.OPENROUTER_API_KEY ?? '');

export default openRouterService;
