import { Router } from 'express';
import openRouterService from '../services/openrouter.js';
import { API_ENDPOINTS, SSE_MARKERS, MessageRole } from '@app/shared';

const router = Router();

/**
 * Validate chat request body
 * @param {Object} body - Request body
 * @returns {{ valid: boolean, error?: string }}
 */
function validateChatRequest(body) {
  const { messages, model } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return { valid: false, error: 'Messages array is required and must not be empty' };
  }

  const validRoles = Object.values(MessageRole);
  for (const msg of messages) {
    if (!msg.role || !validRoles.includes(msg.role)) {
      return { valid: false, error: `Invalid message role. Must be one of: ${validRoles.join(', ')}` };
    }
    if (typeof msg.content !== 'string') {
      return { valid: false, error: 'Message content must be a string' };
    }
  }

  if (model !== undefined && typeof model !== 'string') {
    return { valid: false, error: 'Model must be a string' };
  }

  return { valid: true };
}

// POST /api/chat - Stream chat completion
router.post('/chat', async (req, res) => {
  // Validate request
  const validation = validateChatRequest(req.body);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
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

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

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
            const parsed = JSON.parse(data);
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
    console.error('Chat error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// GET /api/models - Get available models
router.get('/models', async (req, res) => {
  try {
    const models = await openRouterService.getModels();
    res.json({ models });
  } catch (error) {
    console.error('Models error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
