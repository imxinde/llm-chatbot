import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import chatRoutes from './routes/chat.js';

const app = express();
const START_PORT = process.env.PORT || 3000;
const MAX_PORT_ATTEMPTS = 10;

// Middleware
app.use(express.json());
app.use(express.static(fileURLToPath(new URL('../public', import.meta.url))));

// API Routes
app.use('/api', chatRoutes);

// Start server with auto port retry
function startServer(port, attempts = 0) {
  const server = app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
  });

  server.on('error', (err) => {
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
