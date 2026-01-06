import { Router, Request, Response } from 'express';
import type { Router as RouterType } from 'express';
import openRouterService from '../services/openrouter.js';
import { SSE_MARKERS, MessageRole, Message, SSEChunk } from '@app/shared';

const router: RouterType = Router();

/**
 * Chat request body structure
 */
interface ChatRequestBody {
  messages: Message[];
  model?: string;
}

/**
 * Validation result
 */
interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate chat request body
 * @param body - Request body
 * @returns Validation result
 */
function validateChatRequest(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' };
  }

  const { messages, model } = body as Record<string, unknown>;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return { valid: false, error: 'Messages array is required and must not be empty' };
  }

  const validRoles: string[] = Object.values(MessageRole);
  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') {
      return { valid: false, error: 'Each message must be an object' };
    }
    const message = msg as Record<string, unknown>;
    if (!message.role || !validRoles.includes(message.role as string)) {
      return { valid: false, error: `Invalid message role. Must be one of: ${validRoles.join(', ')}` };
    }
    if (typeof message.content !== 'string') {
      return { valid: false, error: 'Message content must be a string' };
    }
  }

  if (model !== undefined && typeof model !== 'string') {
    return { valid: false, error: 'Model must be a string' };
  }

  return { valid: true };
}

/**
 * Type guard to check if body is valid ChatRequestBody
 */
function isChatRequestBody(body: unknown): body is ChatRequestBody {
  return validateChatRequest(body).valid;
}

// POST /api/chat - Stream chat completion
router.post('/chat', async (req: Request, res: Response): Promise<void> => {
  // Validate request
  const validation = validateChatRequest(req.body);
  if (!validation.valid) {
    res.status(400).json({ error: validation.error });
    return;
  }

  if (!isChatRequestBody(req.body)) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  const { messages, model } = req.body;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  try {
    const stream = await openRouterService.streamChat(messages, model);
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    let reading = true;
    while (reading) {
      const { done, value } = await reader.read();
      if (done) {
        reading = false;
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            res.write(`data: ${SSE_MARKERS.DONE}\n\n`);
            continue;
          }

          try {
            const parsed = JSON.parse(data) as SSEChunk;
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    res.write(`data: ${SSE_MARKERS.DONE}\n\n`);
    res.end();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Chat error:', error);
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.end();
  }
});

// GET /api/models - Get available models
router.get('/models', async (_req: Request, res: Response): Promise<void> => {
  try {
    const models = await openRouterService.getModels();
    res.json({ models });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Models error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

export default router;
