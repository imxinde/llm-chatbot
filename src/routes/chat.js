import express from 'express';
import openRouterService from '../services/openrouter.js';

const router = express.Router();

/**
 * POST /api/chat
 * Handle chat requests with streaming response using SSE
 */
router.post('/chat', async (req, res) => {
  const { messages, model } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  // Set headers for Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const stream = await openRouterService.streamChat(messages, model);
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        res.write('data: [DONE]\n\n');
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            res.write('data: [DONE]\n\n');
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            
            if (content) {
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
  } finally {
    res.end();
  }
});

/**
 * GET /api/models
 * Get list of available models
 */
router.get('/models', async (req, res) => {
  try {
    const models = await openRouterService.getModels();
    
    // Filter and format models for frontend
    const formattedModels = models
      .filter(m => m.id && m.name)
      .slice(0, 50)  // Limit to 50 models
      .map(m => ({
        id: m.id,
        name: m.name,
        description: m.description || '',
        context_length: m.context_length
      }));

    res.json({ models: formattedModels });
  } catch (error) {
    console.error('Models error:', error);
    res.status(500).json({ error: 'Failed to fetch models' });
  }
});

export default router;
