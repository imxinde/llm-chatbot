// API Endpoints
export const API_ENDPOINTS = {
  CHAT: '/api/chat',
  MODELS: '/api/models'
};

// Default values
export const DEFAULTS = {
  MODEL: 'openai/gpt-3.5-turbo',
  MODEL_NAME: 'GPT-3.5 Turbo',
  PORT: 3000
};

// SSE Event markers
export const SSE_MARKERS = {
  DONE: '[DONE]',
  DATA_PREFIX: 'data: '
};
