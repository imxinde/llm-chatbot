/**
 * API Specification Types
 * 
 * This module re-exports types that match the OpenAPI specification
 * defined in openapi.yaml
 */

// Re-export all types from shared package for convenience
export type {
  Message,
  MessageRoleType,
  ChatRequest,
  Model,
  ModelsResponse,
  ErrorResponse,
  SSEChunk,
  ChatCompletionResponse,
  OpenRouterModelsResponse,
  AppState,
  AppAction,
  SendChatMessageOptions
} from '@app/shared';

export { MessageRole, API_ENDPOINTS, DEFAULTS, SSE_MARKERS, HTTP_STATUS, CONTENT_TYPES } from '@app/shared';

/**
 * API Route definitions matching OpenAPI spec
 */
export interface ApiRoutes {
  '/api/chat': {
    POST: {
      requestBody: {
        messages: Array<{
          role: 'user' | 'assistant' | 'system';
          content: string;
        }>;
        model?: string;
      };
      response: ReadableStream | string;
    };
  };
  '/api/models': {
    GET: {
      response: {
        models: Array<{
          id: string;
          name: string;
          description?: string;
          context_length?: number;
        }>;
      };
    };
  };
}

/**
 * Extract request body type for a route
 */
export type RequestBody<
  Route extends keyof ApiRoutes,
  Method extends keyof ApiRoutes[Route]
> = ApiRoutes[Route][Method] extends { requestBody: infer R } ? R : never;

/**
 * Extract response type for a route
 */
export type ResponseType<
  Route extends keyof ApiRoutes,
  Method extends keyof ApiRoutes[Route]
> = ApiRoutes[Route][Method] extends { response: infer R } ? R : never;
