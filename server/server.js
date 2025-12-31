import cors from 'cors';
import { Server, SocketIO } from 'boardgame.io/dist/cjs/server.js';
import { Game } from './game.js';

const FRONTEND_URL = 'https://twenty-eight-game.vercel.app';

const server = Server({
  games: [Game],
  transport: new SocketIO({
    cors: {
      origin: FRONTEND_URL,
      methods: ['GET','POST'],
      credentials: true,
    },
  }),
});

// Apply CORS middleware for REST endpoints
server.app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

server.run(8000, { address: '0.0.0.0' });
