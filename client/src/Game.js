export const Game = {
  name: 'twenty-eight',

  setup: (ctx, setupData) => {
    // const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
    const ranks = ['J', '9', 'A', '10', 'K', 'Q', '8', '7'];
    const hierarchy = Object.fromEntries(
      ranks.map((r, i) => [r, ranks.length - i])
    );
    // var fullDeck = ctx.random.Shuffle(
    //   ranks.flatMap(rank => suits.map(suit => ({ rank, suit })))
    // );
    
    const players = {};
    console.log(setupData);
    const joinCode = setupData? setupData.code : null;
    const roomName = setupData? setupData.label : null;
    for (let i = 0; i < 4; i++) {
      players[i] = {
        hand: [],
        bidValue: null,
        round1Bid: false,
        round2Bid: false,
        strongSuitCard: null,
        hasPlayed: false,
        mustPlayTrump: false,
        pointsTally: 0,
        nextGame: false,
        cleared: false,
      };
    }
    return {
      players,
      firstBidder: 0,
      deck: null,
      playedCards: [],
      roundCards: [],
      bids: {},
      highestBid: 0,
      strongSuitCard: null,
      trumpAsked: false,
      highestBidder: null,
      round: 0,
      roundSuit: null,
      hierarchy: hierarchy,
      pointsOrder: { J: 3, '9': 2, A: 1, '10': 1 },
      prevRoundWinner: "0",
      team1Score: 0,
      overallScore1: 0,
      overallScore2: 0,
      team2Score: 0,
      team1Won: null,
      clearing: false,
      joinCode: joinCode,
      roomName: roomName,
    };
  },

  phases: {
    resetBidding: {
      onBegin: ({G, events}) => {
        console.log("reset bids");
        for (const pid in G.players) {
          G.players[pid].round1Bid = false;
          G.players[pid].round2Bid = false;
          G.players[pid].hasPlayed = false;
          G.players[pid].pointsTally = 0;
          G.players[pid].nextGame = false;
          G.players[pid].cleared = false;
        }
        G.round = 0;
        G.strongSuitCard = null;
        G.team1Won = null;
        G.highestBidder = null;
        G.highestBid = 0;
        G.trumpAsked = false;
        G.clearing = false;
        G.playedCards = [];
        G.firstBidder = (G.firstBidder + 1) % 4; 
        G.prevRoundWinner = String(G.firstBidder);
        console.log("heading to initialBidding");
        events.setPhase('initialBidding');
      },
    },
    initialBidding: {
      start: true,
      onBegin: ({G, ctx, random}) => {
        console.log("Starting game:");
        // Empty Player Hands
        for (let pid in G.players) G.players[pid].hand = [];

        // Shuffle deck
        const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
        const ranks = ['J', '9', 'A', '10', 'K', 'Q', '8', '7'];

        G.deck = random.Shuffle(
          ranks.flatMap(rank => suits.map(suit => ({ rank, suit })))
        );
        console.log("Shuffled cards: ", G.deck.length);
        
        // Deal 4 cards per player
        for (let i = 0; i < ctx.numPlayers; i++) {
          const pid = String(i);
          G.players[pid].hand = G.deck.splice(0, 4);
          G.players[pid].round1Bid = false;
          G.players[pid].bidValue = null;
        }
        console.log("Dealt cards:", G.deck.length);
        G.bids = {};
        G.highestBid = 0;
        G.highestBidder = null;
      },

      turn: {
        order: {
          first: ({G}) => G.firstBidder,
          next: ({ ctx }) => (ctx.playOrderPos + 1) % ctx.numPlayers,
        },
        activePlayers: { currentPlayer: 'bid' },
        stages: {
          bid: {
            moves: {
              placeBid({G, ctx, events}, amount, cardIndex) {
                const pid = ctx.currentPlayer;

                // check for bid violations
                if (G.players[pid].round1Bid || amount < 15 || amount > 28) return;
                
                // gather bid stats
                const card = G.players[pid].hand[cardIndex]
                if(!card) return;

                // replace current highest bid
                if (amount > G.highestBid) {
                  
                  // check for previous bid
                  if(G.highestBidder && G.highestBidder !== pid) {
                    
                    // return card to previous bidder
                    const prevBidder = G.players[G.highestBidder];
                    if (prevBidder?.strongSuitCard){
                      prevBidder.hand.push(prevBidder.strongSuitCard);
                      prevBidder.strongSuitCard = null;
                    }
                    
                  }

                  // set new bid
                  const [chosen] = G.players[pid].hand.splice(cardIndex, 1);
                  G.players[pid].strongSuitCard = chosen;
                  G.highestBid = amount;
                  G.highestBidder = pid;
                  G.strongSuitCard = chosen;
                  G.players[pid].round1Bid = true;
                  G.players[pid].bidValue = amount;
                  G.bids[pid] = amount;
                }
                // we outta here
                events.endTurn();
              },

              passBid({G, ctx, events}) {
                const pid = ctx.currentPlayer;
                G.players[pid].round1Bid = true;
                G.bids[pid] = null;
                events.endTurn();
              },
            },
          },
        },
      },

      endIf: ({G, ctx}) => {
        const allBid = Object.values(G.players).every(p => p.round1Bid);
        if (!allBid) return false;
        if (G.highestBidder === null) {
          console.log("No Highest Bid, restarting phase");
          return { next: 'resetBidding' };
        }
        console.log("Round 1 bids complete, proceeding to honors");
        return { next: 'finalBidding' };
      },
    },

    finalBidding: {
      onBegin: ({G, ctx}) => {
        for (let i = 0; i < ctx.numPlayers; i++) {
          const pid = String(i);
          G.players[pid].hand.push(...G.deck.splice(0, 4));
        }
      },

      turn: {
        activePlayers: { currentPlayer: 'final' },
        stages: {
          final: {
            moves: {
              placeBid({G, ctx, events}, amount, cardIndex) {
                const pid = ctx.currentPlayer;

                // check for bid violations
                if (G.players[pid].round2Bid || amount < 20 || amount > 28) return;
                
                // gather bid stats
                const card = G.players[pid].hand[cardIndex]
                if(!card) return;

                // replace current highest bid
                if (amount > G.highestBid) {
                  
                  // check for previous bid
                  if(G.highestBidder && G.highestBidder !== pid) {
                    
                    // return card to previous bidder
                    const prevBidder = G.players[G.highestBidder];
                    if (prevBidder?.strongSuitCard){
                      prevBidder.hand.push(prevBidder.strongSuitCard);
                      prevBidder.strongSuitCard = null;
                    }
                    
                  }

                  // set new bid
                  const [chosen] = G.players[pid].hand.splice(cardIndex, 1);
                  G.players[pid].strongSuitCard = chosen;
                  G.highestBid = amount;
                  G.highestBidder = pid;
                  G.strongSuitCard = [chosen];
                  G.players[pid].round2Bid = true;
                  G.players[pid].bidValue = amount;
                  G.bids[pid] = amount;
                }
                // we outta here
                events.endTurn();
              },

              passBid({G, ctx, events}) {
                const pid = ctx.currentPlayer;
                G.players[pid].round2Bid = true;
                G.bids[pid] = null;
                events.endTurn();
              },

            },
          },
        },
      },

      endIf: ({G, ctx}) => {
        const allBid = Object.values(G.players).every(p => p.round2Bid);
        if (!allBid) return false;
        console.log("Bids placed - starting play");
        return { next: 'play' };
      }
    },

    play: {
      onBegin: ({G, ctx}) => {
        // reset player tracking
        for (let i = 0; i < ctx.numPlayers; i++) {
          const pid = String(i);
          G.players[pid].hasPlayed = false;
          G.players[pid].cleared = false;
        }
        // reset played cards
        G.playedCards = []
        G.clearing = false;
        // set correct round no
        if(G.round === 0){
          G.round++;
        }        
      },

      moves: {
        playCard({G, ctx, events}, index) {
          const player = G.players[String(ctx.currentPlayer)];
          const card = player.hand[index];
          if (!card) return;
          // check for first player
          var firstPlayer = true;
          for (let i = 0; i < ctx.numPlayers; i++) {
            const pid = String(i);
            if (G.players[pid].hasPlayed) {
              firstPlayer = false;
            }
          }
          console.log("checking first player: ", firstPlayer);
          // first player (person who bid) cannot play trump first round
          if(firstPlayer && G.round === 1 && String(G.highestBidder) === String(ctx.currentPlayer)) {
            // check if player is playing trump
            if(card.suit === player.strongSuitCard.suit){
              console.log("cannot play trump first round")
              return;
            }
            
          }

          // if not, good to play (store roundSuit)
          if(firstPlayer){
            console.log("valid card to play");
            G.roundSuit = card.suit;
            console.log("roundSuit: ", G.roundSuit);
          }
          // all other players
          if(!firstPlayer) {
            // if you asked for trump, force trump
            if(player.mustPlayTrump && card.suit !== G.strongSuitCard.suit){
              console.log("must play trump");
              return;
            }
            // if you have card in suit and you're not playing
            var hasCard = false;
            for(let i = 0; i < player.hand.length; i++){
              if(player.hand[i].suit === G.roundSuit){
                console.log("has card in correct suit")
                hasCard = true;
              }
            }
            console.log("round suit: ", G.roundSuit, "hasCard? ", hasCard, "card played: ", card.suit);
            if(hasCard && card.suit !== G.roundSuit ) {
              console.log("invalid card selected");
              return;
            }
          }
          // // reset in case new round
          // if(G.playedCards.length === 4){
          //   G.playedCards = [];
          // }

          G.playedCards.push({ ...card, playerID: ctx.currentPlayer });
          G.players[String(ctx.currentPlayer)].mustPlayTrump = false;
          player.hand.splice(index, 1); 
          events.endTurn();
          G.players[String(ctx.currentPlayer)].hasPlayed = true;
        },

        askForTrump({G, ctx}) {
          // check for valid trump call
          console.log("Asked for trump");
          if(!G.roundSuit){
            console.log("cannot ask for trump first thing");
            return;
          }
          const player = G.players[String(ctx.currentPlayer)];
          var hasCard = false;
          for(let i = 0; i < player.hand.length; i++){
            if(player.hand[i].suit === G.roundSuit){
              hasCard = true;
            }
          }            
          if(hasCard) {
            console.log("player has valid card to play");
            return;
          }

          // reveal trump and keep track
          G.strongSuitCard = G.players[G.highestBidder].strongSuitCard;
          G.trumpAsked = true;
          // can the player play trump?
          hasCard = false;
          for(let i = 0; i < player.hand.length; i++){
            if(player.hand[i].suit === G.strongSuitCard.suit){
              hasCard = true;
            }
          }            
          if(hasCard) {
            G.players[String(ctx.currentPlayer)].mustPlayTrump = true;
          }

          // re-add trump card back to hand if called (will remain visually)
          console.log("added card back to hand: ", G.strongSuitCard.suit, G.strongSuitCard.rank);
          G.players[String(G.highestBidder)].hand.push(G.strongSuitCard);

        },
      },

      turn: {
        order: {
          first: ({G}) => Number(G.prevRoundWinner),
          next: ({ ctx }) => (ctx.playOrderPos + 1) % ctx.numPlayers,
        },
      },

      endIf: ({G, ctx}) => {
        const allPlayed = Object.values(G.players).every(p => p.hasPlayed);
        if(allPlayed){
          if(G.round === 8) {
            console.log("Play finished - scoring now");
            return { next: 'scoring'};
          }
          else {
            return{ next: 'clearMat'};
          }
        }
        else {
          return false;
        }
        
        
      }
    },

    clearMat: {
      onBegin: ({G, ctx, events}) => {
        // set clearing flag
        G.clearing = true;
        console.log("save mat state");
        if(G.round !== 0){
          const snapshot = G.playedCards.map(c => ({ ...c }));
          G.roundCards.push(snapshot);
        }
        for (let i = 0; i < ctx.numPlayers; i++) {
          const pid = String(i);
          G.players[pid].hasPlayed = false;
        }
        console.log("Calculating trick winner");
        // check for trump
        const cardsFromRound = G.playedCards;
        const trumpCards = cardsFromRound.filter(card => card.suit === G.strongSuitCard?.suit);
        let winnercard;
        if(trumpCards.length) {
          winnercard = trumpCards.reduce((best, c) => !best || G.hierarchy[c.rank] > G.hierarchy[best.rank] ? c : best, null);
          G.prevRoundWinner = winnercard.playerID;
          console.log("Winner: ", G.prevRoundWinner);
        }
        else {
          const cardsPlayed = cardsFromRound.filter(card => card.suit === G.roundSuit);
          winnercard = cardsPlayed.reduce((best, c) => !best || G.hierarchy[c.rank] > G.hierarchy[best.rank] ? c :best, null);
          G.prevRoundWinner = winnercard.playerID;
          console.log("Winner: ", G.prevRoundWinner);
        }
        const totalPoints = cardsFromRound.reduce((sum, card) => sum + (G.pointsOrder[card.rank] ?? 0), 0);
        G.players[G.prevRoundWinner].pointsTally += totalPoints;
        G.round++;
        console.log("waiting on UI updates");
      },

      moves: {
        finishClearing({G, ctx, events}, playerNo) {
          G.players[String(playerNo)].cleared = true;
          console.log(`Player ${playerNo} cleaned table`);
          events.endTurn();
        },
      },

      turn: {
        order: {
          first: ({G}) => Number(G.prevRoundWinner),
          next: ({ ctx }) => (ctx.playOrderPos + 1) % ctx.numPlayers,
        },
      },

      endIf: ({G, ctx, events}) => {
        const allCleared = Object.values(G.players).every(p => p.cleared);
        if(allCleared) {
          if(G.round > 8){
            console.log("Going to next phase: scoring");
            events.setPhase('scoring');
          } else {
            console.log('Going to next phase: play');
            events.setPhase('play');
          }
        } else {
          return false;
        }
      },
    },

    scoring: {
      onBegin: ({G, ctx, events}) => {
        
        // figuring last round winner
        const cardsFromRound = G.playedCards;
        const trumpCards = cardsFromRound.filter(card => card.suit === G.strongSuitCard?.suit);
        let winnercard;
        if(trumpCards.length) {
          winnercard = trumpCards.reduce((best, c) => !best || G.hierarchy[c.rank] > G.hierarchy[best.rank] ? c : best, null);
          G.prevRoundWinner = winnercard.playerID;
          console.log("Winner: ", G.prevRoundWinner);
        }
        else {
          const cardsPlayed = cardsFromRound.filter(card => card.suit === G.roundSuit);
          winnercard = cardsPlayed.reduce((best, c) => !best || G.hierarchy[c.rank] > G.hierarchy[best.rank] ? c :best, null);
          G.prevRoundWinner = winnercard.playerID;
          console.log("Winner: ", G.prevRoundWinner);
        }
        const totalPoints = cardsFromRound.reduce((sum, card) => sum + (G.pointsOrder[card.rank] ?? 0), 0);
        G.players[G.prevRoundWinner].pointsTally += totalPoints;
        
        // figuring final scores
        G.team1Score = G.players["0"].pointsTally + G.players["2"].pointsTally;
        G.team2Score = G.players["1"].pointsTally + G.players["3"].pointsTally;

        if(Number(G.highestBidder) === 0 || Number(G.highestBidder) === 2){
          if(G.team1Score >= G.highestBid){
            G.team1Won = true;
            if(G.highestBid >= 20){
              G.overallScore1 += 2;
            }
            else {
              G.overallScore1 += 1;
            }
            console.log("Team 1 won with score ", G.team1Score);
          }
          else{
            if(G.highestBid >= 20){
              G.overallScore1 -= 3;
            } else {
              G.overallScore1 -= 2;
            }
            console.log("Team 1 lost with score ", G.team1Score);
          }
        }
        else {
          if(G.team2Score < G.highestBid){
            G.team1Won = true;
            if(G.highestBid >= 20){
              G.overallScore2 -= 3;
            } else {
              G.overallScore2 -= 2;
            }
            console.log("Team 2 lost with score ", G.team1Score);
          }
          else {
            if(G.highestBid > 20){
              G.overallScore2 += 2;
            } else {
              G.overallScore2 += 1;
            }
            console.log("Team 2 won with score ", G.team2Score);
          }
        }
      },

      moves: {
        confirm({G, ctx, events}) {
          console.log("Player ", ctx.currentPlayer, "confirms");
          G.players[String(ctx.currentPlayer)].nextGame = true;
          events.endTurn();
        }
      },

      turn: {
        order: {
          first: ({G}) => Number(G.prevRoundWinner),
          next: ({ ctx }) => (ctx.playOrderPos + 1) % ctx.numPlayers,
        },
      },

      endIf: ({G, events}) => {
        const allBid = Object.values(G.players).every(p => p.nextGame);
        if(!allBid) return false;
        console.log("Starting next game");
        return {next: 'resetBidding'}
      },
    }
  },
};
