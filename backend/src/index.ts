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

// TODO: move this to env properly later
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://live-polling-xi.vercel.app';

// Allowed origins for CORS
const allowedOrigins = [
  FRONTEND_URL,
  'http://localhost:3000',
  'https://live-polling-xi.vercel.app',
  /\.vercel\.app$/  // Allow all Vercel preview deployments
];

// cors was giving me issues so just allowing everything for now
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now during development
    }
  },
  credentials: true
}));

app.use(express.json());

// socket io
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      callback(null, true); // just allow all lol
    },
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
  console.log('lets goo');
});
