import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import chatRoutes from './routes/chat.js';
import { DEFAULTS } from '@app/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const START_PORT: number = Number(process.env.PORT) || DEFAULTS.PORT;
const MAX_PORT_ATTEMPTS = 10;

// CORS configuration type
interface CorsOptions {
  origin: string | string[];
  credentials: boolean;
}

const corsOptions: CorsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

// API Routes
app.use('/api', chatRoutes);

// Production: Serve frontend static files
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Server error type
interface ServerError extends Error {
  code?: string;
}

// Start server with auto port retry
function startServer(port: number, attempts = 0): void {
  const server = app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
    if (process.env.NODE_ENV === 'production') {
      console.log(`📦 Serving frontend from apps/frontend/dist`);
    }
  });

  server.on('error', (err: ServerError) => {
    if (err.code === 'EADDRINUSE' && attempts < MAX_PORT_ATTEMPTS) {
      console.log(`⚠️  Port ${port} is in use, trying ${port + 1}...`);
      startServer(port + 1, attempts + 1);
    } else {
      console.error(`❌ Failed to start server: ${err.message}`);
      process.exit(1);
    }
  });
}

startServer(START_PORT);
