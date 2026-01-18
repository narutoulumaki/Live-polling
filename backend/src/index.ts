import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import pollRoutes from './routes/polls';
import { setupSocketHandlers } from './sockets/PollSocketHandler';

dotenv.config();

const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// CORS configuration
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: [FRONTEND_URL, 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Setup socket handlers
setupSocketHandlers(io);

// REST API routes
app.use('/api/polls', pollRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
});
