const { Server, Origins, SocketIO } = require('boardgame.io/server');
const { Game } = require('./Game.js');

const server = Server({
  games: [Game],
  origins: [Origins.LOCALHOST],
  transport: new SocketIO,
});

server.run(8000);
