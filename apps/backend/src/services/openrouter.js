import { DEFAULTS } from '@app/shared';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';

class OpenRouterService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'LLM ChatBot'
    };
  }

  /**
   * Stream chat completion
   * @param {Array} messages - Array of message objects
   * @param {string} model - Model ID
   * @returns {ReadableStream} - SSE stream
   */
  async streamChat(messages, model = DEFAULTS.MODEL) {
    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        model,
        messages,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    return response.body;
  }

  /**
   * Non-streaming chat completion
   * @param {Array} messages - Array of message objects
   * @param {string} model - Model ID
   * @returns {Object} - Chat completion response
   */
  async chat(messages, model = DEFAULTS.MODEL) {
    const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        model,
        messages,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get available models
   * @returns {Array} - Array of model objects
   */
  async getModels() {
    const response = await fetch(`${OPENROUTER_API_URL}/models`, {
      method: 'GET',
      headers: this.headers
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data = await response.json();
    
    // Format and limit models
    return data.data
      .slice(0, 50)
      .map(model => ({
        id: model.id,
        name: model.name || model.id.split('/').pop(),
        description: model.description || '',
        context_length: model.context_length || 4096
      }));
  }
}

// Validate API key on startup
if (!process.env.OPENROUTER_API_KEY) {
  console.error('❌ OPENROUTER_API_KEY is not set in environment variables');
  console.error('   Please create a .env file with your API key');
  console.error('   See .env.example for reference');
}

const openRouterService = new OpenRouterService(process.env.OPENROUTER_API_KEY);

export default openRouterService;
