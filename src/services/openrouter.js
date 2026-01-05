/**
 * OpenRouter API Service
 * Handles communication with OpenRouter API for LLM chat completions
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';

class OpenRouterService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.defaultModel = 'openai/gpt-3.5-turbo';
  }

  /**
   * Get common headers for OpenRouter API requests
   */
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'LLM ChatBot'
    };
  }

  /**
   * Send a chat request and get streaming response
   * @param {Array} messages - Array of message objects with role and content
   * @param {string} model - Model identifier
   * @returns {ReadableStream} - Stream of response chunks
   */
  async streamChat(messages, model = this.defaultModel) {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    return response.body;
  }

  /**
   * Send a chat request and get complete response (non-streaming)
   * @param {Array} messages - Array of message objects
   * @param {string} model - Model identifier
   * @returns {Object} - Complete response object
   */
  async chat(messages, model = this.defaultModel) {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get list of available models from OpenRouter
   * @returns {Array} - Array of model objects
   */
  async getModels() {
    const response = await fetch(OPENROUTER_MODELS_URL, {
      method: 'GET',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  }
}

// Create singleton instance
const openRouterService = new OpenRouterService(process.env.OPENROUTER_API_KEY);

module.exports = openRouterService;
