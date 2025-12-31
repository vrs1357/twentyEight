const { cors } = require('cors');

const { Server, Origins, SocketIO } = require('boardgame.io/server');
const { Game } = require('./game.js');


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
