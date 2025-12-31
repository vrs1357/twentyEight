import cors from 'cors';
import { Server, SocketIO } from 'boardgame.io/server';
import { Game } from './game.js';

// Allow your Vercel frontend
const FRONTEND_URL = 'https://twenty-eight-game.vercel.app';

const server = Server({
  games: [Game],
  transport: new SocketIO({
    cors: {
      origin: FRONTEND_URL, // Only allow your frontend
      methods: ['GET','POST'],
      credentials: true,
    },
  }),
});

// Apply CORS middleware to REST API endpoints
server.app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

server.run(8000, { address: '0.0.0.0' });
