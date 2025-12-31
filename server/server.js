import cors from 'cors'

import { Server, Origins, SocketIO } from 'boardgame.io/server';
import { Game } from './game.js';


const server = Server({
  games: [Game],
  origins: [Origins.LOCALHOST],
  transport: new SocketIO,
});
server.app.use(
  cors({
    origin: "https://twenty-eight-game.vercel.app",
    credentials: true
  })
)
server.run(8000);
