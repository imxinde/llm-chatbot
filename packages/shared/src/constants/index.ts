/**
 * API endpoint paths
 */
export const API_ENDPOINTS = {
  CHAT: '/api/chat',
  MODELS: '/api/models'
} as const;

/**
 * API endpoint type
 */
export type ApiEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS];

/**
 * Default configuration values
 */
export const DEFAULTS = {
  MODEL: 'openai/gpt-3.5-turbo',
  MODEL_NAME: 'GPT-3.5 Turbo',
  PORT: 3000
} as const;

/**
 * SSE (Server-Sent Events) markers
 */
export const SSE_MARKERS = {
  DONE: '[DONE]',
  DATA_PREFIX: 'data: '
} as const;

/**
 * HTTP status codes used in the application
 */
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  INTERNAL_SERVER_ERROR: 500
} as const;

/**
 * Content types for HTTP headers
 */
export const CONTENT_TYPES = {
  JSON: 'application/json',
  SSE: 'text/event-stream'
} as const;
