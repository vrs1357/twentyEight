import React, { useState } from 'react';
import { Client } from 'boardgame.io/react';
import { SocketIO } from 'boardgame.io/multiplayer';
import { LobbyClient } from 'boardgame.io/client';
import { Game } from './Game';
import Board from './Board';
import toast, { Toaster } from 'react-hot-toast';
const SERVER_URL = import.meta.env.VITE_BGIO_SERVER;


const SERVER = `http://${SERVER_URL}`;
const GAME_NAME = 'twenty-eight';

const CardGameClient = Client({
  game: Game,
  board: Board,
  multiplayer: SocketIO({ server: SERVER }),
});

const lobby = new LobbyClient({ server: SERVER });

// 4-char alphanumeric code like “A3FQ”
const makeCode = () => Math.random().toString(36).slice(2, 6).toUpperCase();

async function createUniqueCode() {
  const { matches } = await lobby.listMatches(GAME_NAME);
  const taken = new Set(matches.map(m => m.setupData?.code).filter(Boolean));
  let tries = 0;
  let code = makeCode();
  while (taken.has(code) && tries < 20) {
    code = makeCode();
    tries++;
  }
  if (taken.has(code)) throw new Error('Could not generate unique code');
  return code;
}

// Try seats 0..N-1 until join succeeds
async function tryJoinOpenSeat(matchID, playerName, seats = 4) {
  for (let i = 0; i < seats; i++) {
    try {
      const { playerCredentials } = await lobby.joinMatch(GAME_NAME, matchID, {
        playerID: String(i),
        playerName,
      });
      return { playerID: String(i), credentials: playerCredentials };
    } catch {
      // seat taken; continue
    }
  }
  throw new Error('Room is full.');
}

export default function RoomManager() {
  const [username, setUsername] = useState('');
  const [roomCode, setRoomCode] = useState(''); // always 4-char code
  const [joined, setJoined] = useState(false);
  const [playerID, setPlayerID] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [matchID, setMatchID] = useState(null);

  const checkUsername = () => {
    if (username.trim() === '') {
      toast.error('Please enter a valid username');
      return false;
    }
    return true;
  };

  const createRoom = async () => {
    if (!checkUsername()) return;
    try {
      const code = await createUniqueCode();

      const { matchID } = await lobby.createMatch(GAME_NAME, {
        numPlayers: 4,
        setupData: { code, label: `${username}'s Table` },
      });

      const { playerID, credentials } = await tryJoinOpenSeat(matchID, username);

      setMatchID(matchID);
      setRoomCode(code); // show/share this code
      setPlayerID(playerID);
      setCredentials(credentials);
      console.log("Match details: ", code, matchID);
      setJoined(true);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to create room.');
    }
  };

  // Resolve 4-char code -> matchID
  const resolveMatchIDByCode = async (code) => {
    const { matches } = await lobby.listMatches(GAME_NAME);
    const m = matches.find(
      x => x.setupData?.code?.toUpperCase() === code.toUpperCase()
    );
    return m?.matchID ?? null;
  };

  const joinRoom = async () => {
    if (!checkUsername()) return;

    const code = roomCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{4}$/.test(code)) {
      toast.error('Room code must be 4 letters/numbers (e.g., A3FQ).');
      return;
    }

    try {
      const resolvedMatchID = await resolveMatchIDByCode(code);
      if (!resolvedMatchID) {
        toast.error('Room not found for that code.');
        return;
      }

      const { playerID, credentials } = await tryJoinOpenSeat(resolvedMatchID, username);

      setMatchID(resolvedMatchID);
      setPlayerID(playerID);
      setCredentials(credentials);
      setRoomCode(code);
      setJoined(true);
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error joining match.');
    }
  };

  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
        <Toaster />
        <h1 className="text-4xl font-bold mb-6">28: The Online Edition</h1>
        <div className="bg-white p-8 rounded shadow-md text-black w-full max-w-sm">
          <label className="block mb-2">Username</label>
          <input
            className="w-full p-2 mb-4 border rounded"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <button
            className="w-full bg-indigo-600 text-white py-2 rounded mb-4 hover:bg-indigo-700"
            onClick={createRoom}
          >
            Create Room
          </button>

          <label className="block mb-2">Join Room</label>
          <input
            className="w-full p-2 mb-4 border rounded"
            placeholder="Enter 4-char code (e.g., A3FQ)"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength={4}
          />

          <button
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
            onClick={joinRoom}
          >
            Join Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <CardGameClient
      playerID={playerID}
      matchID={matchID}
      credentials={credentials}
    />
  );
}
