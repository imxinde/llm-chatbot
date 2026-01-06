// Re-export API types from generated OpenAPI types
// These types will be available after running `pnpm generate:api`

/**
 * @typedef {Object} Message
 * @property {'user' | 'assistant' | 'system'} role
 * @property {string} content
 */

/**
 * @typedef {Object} ChatRequest
 * @property {Message[]} messages
 * @property {string} [model]
 */

/**
 * @typedef {Object} Model
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {number} [context_length]
 */

/**
 * @typedef {Object} ModelsResponse
 * @property {Model[]} models
 */

/**
 * @typedef {Object} ErrorResponse
 * @property {string} error
 */

export const MessageRole = {
  USER: 'user',
  ASSISTANT: 'assistant',
  SYSTEM: 'system'
};
