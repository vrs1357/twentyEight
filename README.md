# 28 - The Game

I came up with an online version of a game played at home, called 28. You can find instructions on how to play it, or deploy it on your own. Known issues/bugs/fixes can be found at the end, feel free to create a PR for a fix

This game was written using boardgame.io. Documentation for how to modify the game/use boardgame.io can be found [here](https://boardgame.io/).
## Game Rules

will be written shortly

## Local Testing

To test this game locally (run client & server on the same machine), remove koa-cors from the server.js file. On the frontend, ensure the backend is redirected to localhost:8000. Then, run as usual.

## Deployment 

this program uses node.js on koa to run the game on a boardgame.io instance. The command```npm start``` is used to run both client and server. Specifically for the test deployment, Oracle VMs were used for the backend with the client hosted on Vercel.


## Known Issues and Future Work

TBD:
- client disconnects and reconnects
- clearing the board properly
- general UI decluttering & improvements
- notifs for key moves
- half court/full court gameplay