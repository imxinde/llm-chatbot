import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import chatRoutes from './routes/chat.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(fileURLToPath(new URL('../public', import.meta.url))));

// API Routes
app.use('/api', chatRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
