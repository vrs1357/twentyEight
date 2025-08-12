import { Toaster, toast } from "react-hot-toast";
import Card from "./card";
import React, { useState } from "react";

export default function Board({ G, ctx, playerID, matchData, moves }) {

  const [isHovered, setHovered] = useState(false);
  const [bidValue, setBidValue] = useState(15);
  const [strongIndex, setStrongIndex] = useState(null);
  const [willBid, setWillBid] = useState(false);
 

  const playerHand = G.players && G.players[playerID] && G.players[playerID].hand ? G.players[playerID].hand : [];

  const rotatedPlayerIDs = Array.from({ length: 4 }, (_, i) =>
    (parseInt(playerID) + i) % 4
  );

  const isInitialBidding = ctx.phase === "initialBidding";
  const isFinalBidding = ctx.phase === "finalBidding";
  const isPlay = ctx.phase === "play";
  const isYourTurn = ctx.currentPlayer === playerID;
  const isHighestBidder = G.highestBidder === playerID;

   const minBid = isFinalBidding
    ? Math.max((G.highestBid ?? 0) + 1, 20)
    : Math.max((G.highestBid ?? 0) + 1, 15);

  const getOffsetForPlayer = (cardPlayerID) => {
    const index = rotatedPlayerIDs.indexOf(Number(cardPlayerID));
    switch (index) {
      case 0:
        return { x: 0, y: 50 }; // Bottom
      case 1:
        return { x: -50, y: 0 }; // Left
      case 2:
        return { x: 0, y: -50 }; // Top
      case 3:
        return { x: 50, y: 0 }; // Right
      default:
        return { x: 0, y: 0 };
    }
  };

  const handleCardClick = (index, card) => {
    if (!card) {
      console.log("Not a clickable card");
      return;
    }
  
    // Strong suit selection (finalBidding + you're highest bidder)
    if (isFinalBidding && isHighestBidder && !G.players[playerID].strongSuitCard) {
      moves.setStrongSuitCard(index);
      toast.success("Strong suit selected!");
      return;
    }

    // Regular play
    if (ctx.currentPlayer === playerID) {
      moves.playCard(index);
    } else {
      console.log("Not your turn!");
    }
  };

  const renderCards = (targetPlayerID, direction) => {
    const isVertical = direction === "vertical";
    const isBottom = String(targetPlayerID) === String(playerID);
    const isCurrentTurn = String(ctx.currentPlayer) === String(targetPlayerID);
    const playerCardCount = G.players[targetPlayerID].hand.length

    const handleEnter = () => {
      if (isBottom) setHovered(true);
    };
    const handleLeave = () => {
      if (isBottom) setHovered(false);
    };

    const hand = isBottom ? playerHand : Array(playerCardCount).fill(null);
    const angleStart = -20;
    const angleStep = playerCardCount > 1 ? 20 / (playerCardCount - 1) : 0;
    const shouldFan = !(isBottom && isHovered);

    return (
      <div
        className={`relative flex ${
          isVertical ? "flex-col items-center" : "flex-row justify-center"
        }`}
        style={{ height: isVertical ? `${5.5 * playerCardCount}rem` : "auto" }}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {hand.map((card, i) => {
          const angle = shouldFan ? angleStart + i * angleStep : 0;
          const marginLeft = shouldFan ? "-ml-12" : "ml-1";

          return (
            <div
              key={i}
              className={`relative z-10 ${
                i > 0 ? marginLeft : ""
              } flex-shrink-0 ${
                isCurrentTurn ? "shadow-glow rounded-xl" : ""
              }`}
              style={{
                transform: `rotate(${angle}deg)`,
                transition: "transform 0.2s ease-in-out, margin 0.2s ease-in-out",
              }}
              onClick={() => handleCardClick(i, card)}
            >
              <Card
                faceUp={isBottom}
                liftOnHover={isBottom}
                suit={isBottom ? card?.suit : undefined}
                rank={isBottom ? card?.rank : undefined}
              />
            </div>
          );
        })}
      </div>
    );
  };
  // trump renderer
  const renderTrump = (ownerPid) => {
    // Only show if this seat owns the trump
    const bidder = G.highestBidder;
    if (bidder == null || String(ownerPid) !== String(bidder)) return null;

    const strong = G.players?.[bidder]?.strongSuitCard;
    if (!strong) return null;

    var faceUp = String(playerID) === String(bidder);
    
    if(G.trumpAsked){
      faceUp = true;
    }

    return (
      <div className="flex flex-col items-center">
        <div className="mt-2 scale-90">
          <Card faceUp={faceUp} rank={strong.rank} suit={strong.suit} />
        </div>
      </div>
    );
  };

  // trump ask button
  const askTrump = ()=> {
    // check for valid move
    if(!isPlay){
      toast.error("Still in bidding phase");
    }
    // play move
    moves.askForTrump();

    // if(G.trumpAsked) {
    //   toast("Trump Revealed", {
    //     icon: 'ℹ️',
    //   });
    // }
  }
  // bidding helper function
  const confirmBid = () => {
    if(strongIndex == null) {
      toast.error("Please select a Trump card first");
    }
    setWillBid(false);
    toast.success("Placed Bid");
    moves.placeBid(bidValue, strongIndex);
  }

  // final modal renderer
  const renderWinModal = () => {
    const showWin = ctx.phase === "scoring";
    if (!showWin || !G?.players) return null;

    // Teams: 0 & 2 vs 1 & 3 (adjust if your game differs)
    const team1 = ["0", "2"];
    const team2 = ["1", "3"];

    const nameFor = (pid) => matchData?.[pid]?.name ?? `Player ${pid}`;

    const team1Score = G.team1Score;
    const team2Score = G.team2Score;

    const winner =
      team1Score > team2Score ? "Team 1" : "Team 2";

    const tag = (text) => (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
        {text}
      </span>
    );

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center" role="dialog" aria-modal="true">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60" />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-[720px] max-w-[95vw] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Game Over</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold
              ${winner === 'Team 1' ? 'bg-emerald-200 text-emerald-900' : 'bg-indigo-200 text-indigo-900'}`}>
              { `${winner} Wins`}
            </span>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className={`rounded-xl border p-4 ${winner === 'Team 1' ? 'bg-emerald-200' : 'bg-red-100'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Team 1</h3>
                {tag(`${team1Score} pts`)}
              </div>
              <ul className="text-sm text-gray-700 space-y-1">
                {team1.map(pid => {
                  const isBidder = String(pid) === G.highestBidder;
                  return (
                    <li key={pid} className={isBidder ? "font-bold rounded" : ""}>
                      • {matchData?.[pid]?.name?? `Player ${pid}`}
                      {isBidder && (
                        <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-amber-200 text-amber-900">
                          Bidder
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className={`rounded-xl border p-4 ${winner === 'Team 2' ? 'bg-emerald-200' : 'bg-red-100'} `}>
              <div className={`flex items-center justify-between mb-2`}>
                <h3 className="font-semibold">Team 2</h3>
                {tag(`${team2Score} pts`)}
              </div>
              <ul className="text-sm text-gray-700 space-y-1">
                {team2.map(pid => {
                  const isBidder = String(pid) === G.highestBidder;
                  return (
                    <li key={pid} className={isBidder ? "font-semibold rounded px-1" : ""}>
                      • {matchData?.[pid]?.name?? `Player ${pid}`}
                      {isBidder && (
                        <span className="ml-1 text-[10px] px-1 py-0.5 rounded bg-amber-200 text-amber-900">
                          Bidder
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Final line */}

          {String(ctx.currentPlayer) === String(playerID) && (
            <div className="flex items-center justify-between">

              <button
                type="button"
                className="uppercase tracking-wide text-xs font-semibold px-4 py-2
                          rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black
                          shadow shadow-amber-700/30"
                onClick={() => {
                  moves.confirm();
                  toast("Waiting on others to confirm", { icon:'⏳'});
                }}
              >
                Next Game
              </button>
              </div>
              )}
        </div>
      </div>
    );
  };


  if (!ctx || playerID === null) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
        <div className="flex space-x-2 justify-center items-center h-screen bg-gray-900">
          <div className="w-4 h-4 bg-white rounded-full animate-bounce"></div>
          <div className="w-4 h-4 bg-white rounded-full animate-bounce [animation-delay:-0.2s]"></div>
          <div className="w-4 h-4 bg-white rounded-full animate-bounce [animation-delay:-0.4s]"></div>
        </div>
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
        <p>Connecting to match...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-green-100 flex items-center justify-center relative">
      {/* Highest bid display */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-blue-500 px-4 py-2 rounded shadow z-40">
        <div className="flex items-center gap-3">
          <span className="rounded-sm px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800">
            {ctx.phase}
          </span>
          <p className="text-sm text-black">
            Highest Bid: <strong>{G.highestBid || "—"}</strong> by{" "}
            <strong>
              {G.highestBidder != null
                ? matchData?.[G.highestBidder]?.name ??
                  `Player ${G.highestBidder}`
                : "—"}
            </strong>
          </p>
        </div>
      </div>

      {/* Scoreboard (always visible) */}
      <div className="absolute top-2 left-2 z-40">
        <div className="bg-white/60 backdrop-blur rounded-xl shadow p-3 w-64">
          <div className="text-xs font-semibold text-gray-600 mb-2">{G.roomName?? 'Room'}: {G.joinCode?? '-'}</div>

          <div className="space-y-2">
            {/* Team 1 */}
            <div className="border rounded-lg p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">Team 1</span>
                <span className="text-sm font-semibold">{G.overallScore1}</span>
              </div>
              <div className="text-xs text-gray-600">
                {matchData?.[0]?.name ?? "Player 0"} • {matchData?.[2]?.name ?? "Player 2"}
              </div>
            </div>

            {/* Team 2 */}
            <div className="border rounded-lg p-2">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">Team 2</span>
                <span className="text-sm font-semibold">{G.overallScore2}</span>
              </div>
              <div className="text-xs text-gray-600">
                {matchData?.[1]?.name ?? "Player 1"} • {matchData?.[3]?.name ?? "Player 3"}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Bidding controls */}
      {(isInitialBidding || isFinalBidding) && isYourTurn && !willBid && (
        <div className="absolute bottom-100 left-1/2 transform -translate-x-1/2 bg-white border p-4 rounded shadow-xl z-50">
          <h3 className="text-lg font-bold text-black mb-2">
            {"Placing a bid?"}
          </h3>
          {(
            <button
              onClick={() => moves.passBid()}
              className="bg-gray-400 text-white px-4 py-1 rounded"
            >
              Pass
            </button>
          )}
          <button
            onClick={() => {setWillBid(true)}}
            className="bg-blue-600 text-white px-4 py-1 rounded ml-2" 
          >
            Bid
          </button>
        </div>
      )}
      {isYourTurn && (isInitialBidding || isFinalBidding) && willBid && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => moves.passBid()} />
          <div className="relative bg-white rounded-2xl p-6 w-[720px] max-w-[95vw] shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-1">{"Place Your Bid"}</h3>
            <p className="text-sm text-gray-600 mb-4">Pick a card as your strong suit and enter your bid.</p>

            {/* Hand to choose strong suit */}
            <div className="flex justify-center flex-wrap gap-3 mb-5">
              {G.players[playerID]?.hand?.map((card, idx) => {
                const selected = strongIndex === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`relative rounded-md transition ${selected ? "ring-4 ring-yellow-400" : "ring-0"}`}
                    onClick={() => setStrongIndex(idx)}
                    aria-pressed={selected}
                    title={`${card.rank} of ${card.suit}`}
                  >
                    <Card faceUp rank={card.rank} suit={card.suit} />
                    {selected && (
                      <span className="absolute -bottom-5 -right-0 bg-yellow-400 text-black text-xs px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bid input + actions */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Your bid</label>
                <input
                  type="number"
                  min={minBid}
                  max={28}
                  value={bidValue}
                  onChange={(e) => setBidValue(parseInt(e.target.value))}
                  className="border rounded px-2 py-1 w-24"
                />
              </div>

              <div className="flex gap-2">
                <button className="px-4 py-2 rounded bg-gray-200" onClick={() => moves.passBid()}>
                  Pass
                </button>
                <button
                  className={`px-4 py-2 rounded text-white ${
                    strongIndex == null || bidValue < minBid || bidValue > 28
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                  disabled={strongIndex == null || bidValue < minBid || bidValue > 28}
                  onClick={confirmBid}
                >
                  Confirm Bid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Board */}
      <div className="grid grid-rows-3 grid-cols-3 gap-2 w-[700px] h-[700px]">
        {/* Top Player */}
        <div className="row-start-1 col-start-2 flex justify-center items-center">
          <div className="flex flex-col items-center">
            <div className="text-md text-black mb-1 py-4">
              {matchData?.[rotatedPlayerIDs[2]]?.name ??
                `Waiting for Player ${rotatedPlayerIDs[2]}`}
            </div>
            {renderCards(rotatedPlayerIDs[2], "horizontal")}
          </div>
        </div>
        
        {/* Top Player Trump Location */}
        <div className="row-start-1 col-start-1 gap-2 mt-10 ml-40">
          {renderTrump(rotatedPlayerIDs[2])}
        </div>
        
        {/* Left Player */}
        <div className="col-start-1 row-start-2 flex justify-center items-center">
          <div className="flex flex-col items-center rotate-[-90deg]">
            <div className="text-sm text-black mb-1 py-4">
              {matchData?.[rotatedPlayerIDs[1]]?.name ??
                `Waiting for Player ${rotatedPlayerIDs[1]}`}
            </div>
            {renderCards(rotatedPlayerIDs[1], "horizontal")}
          </div>
        </div>
        {/* Left Player trump location */}
        <div className="col-start-1 row-start-3 rotate-[90deg] ml-20 mb-60">
            {renderTrump(rotatedPlayerIDs[1])}
        </div>
        
        {/* Center */}
        <div className="row-start-2 col-start-2 bg-green-700 flex justify-center items-center rounded shadow relative">
          <Toaster />
          {G.playedCards ? G.playedCards.map((card, i) => {
            const offset = getOffsetForPlayer(card.playerID);
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px)`,
                  zIndex: i,
                }}
              >
                <Card faceUp rank={card.rank} suit={card.suit} />
              </div>
            );
          }) : null}
        </div>

        {/* Right Player */}
        <div className="col-start-3 row-start-2 flex justify-center items-center">
          <div className="flex flex-col items-center rotate-[90deg]">
            <div className="text-sm text-black mb-1 py-4 ">
              {matchData?.[rotatedPlayerIDs[3]]?.name ??
                `Waiting for Player ${rotatedPlayerIDs[3]}`}
            </div>
            {renderCards(rotatedPlayerIDs[3], "horizontal")}
          </div>
        </div>
        {/* Right player trump location */}
        <div className="col-start-3 row-start-1 rotate-[-90deg] mt-40">
          {renderTrump(rotatedPlayerIDs[3])}
        </div>

        {/* Bottom (You) */}
        <div className="row-start-3 col-start-2 flex justify-center items-center">
          <div className="flex flex-col items-center">
            <div className="text-sm text-black mb-1 py-4">
              {matchData?.[rotatedPlayerIDs[0]]?.name ??
                `Waiting for Player ${rotatedPlayerIDs[0]}`}
            </div>
            {renderCards(rotatedPlayerIDs[0], "bottom")}
          </div>
        </div>
        {/* Your Trump Location */}
          <div className="row-start-3 col-start-3">
            {!G.trumpAsked && isPlay && (
              <button
              type="button"
              className="uppercase tracking-wide text-[12px] font-semibold px-3 py-3
                        rounded-md bg-gradient-to-r from-amber-400 to-yellow-500 text-black
                        shadow shadow-amber-700/30 mt-8"
              onClick={() => {askTrump()}}
              >
                Ask for Trump
              </button>
            ) }
          <div className="mr-20">
                {renderTrump(rotatedPlayerIDs[0])}
          </div>
        </div>
      </div>
      {renderWinModal()}
    </div>
  );
}
