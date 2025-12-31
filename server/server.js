import KoaCors from '@koa/cors';
import { Server, Origins, SocketIO } from 'boardgame.io/dist/cjs/server.js';
import { Game } from './game.js';

const FRONTEND_URL = 'https://twenty-eight-game.vercel.app';

const server = Server({
  games: [Game],
  origins: [Origins.LOCALHOST, FRONTEND_URL],
  transport: new SocketIO({
    cors: {
      origin: FRONTEND_URL,
      methods: ['GET','POST'],
      credentials: true,
    },
  }),
});

// Use Koa CORS middleware for REST endpoints
server.app.use(KoaCors({
  origin: FRONTEND_URL,
  allowMethods: ['GET','POST','OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

server.run({
  port: 8000,
  address: '0.0.0.0',
  callback: () => console.log('boardgame.io server running on port 8000')
});
