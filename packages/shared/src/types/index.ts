/**
 * Message role enum values
 */
export const MessageRole = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system',
} as const;

/**
 * Message role type - union of all possible role values
 */
export type MessageRoleType = (typeof MessageRole)[keyof typeof MessageRole];

/**
 * Chat message structure
 */
export interface Message {
  id?: string;
  role: MessageRoleType;
  content: string;
}

/**
 * Chat request payload
 */
export interface ChatRequest {
  messages: Message[];
  model?: string;
}

/**
 * LLM Model information
 */
export interface Model {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
}

/**
 * Models list API response
 */
export interface ModelsResponse {
  models: Model[];
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: string;
}

/**
 * SSE chunk data structure from OpenRouter
 */
export interface SSEChunk {
  id?: string;
  object?: string;
  created?: number;
  model?: string;
  choices?: {
    index: number;
    delta?: {
      role?: string;
      content?: string;
    };
    finish_reason?: string | null;
  }[];
}

/**
 * Chat completion response (non-streaming)
 */
export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenRouter models list response
 */
export interface OpenRouterModelsResponse {
  data: {
    id: string;
    name: string;
    description?: string;
    context_length?: number;
    pricing?: {
      prompt: string;
      completion: string;
    };
  }[];
}

/**
 * Application state structure
 */
export interface AppState {
  messages: Message[];
  currentModel: string;
  currentModelName: string;
  models: Model[];
  isLoading: boolean;
  isModalOpen: boolean;
}

/**
 * Action types for reducer
 */
export type AppAction =
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_LAST_MESSAGE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_MODELS'; payload: Model[] }
  | { type: 'SELECT_MODEL'; payload: { id: string; name: string } }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'TOGGLE_MODAL' };

/**
 * Send chat message options
 */
export interface SendChatMessageOptions {
  messages: Message[];
  model?: string;
  signal?: AbortSignal;
  onChunk: (content: string) => void;
  onError?: (error: Error) => void;
  onDone?: () => void;
}
