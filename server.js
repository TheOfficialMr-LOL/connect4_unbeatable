const { v4: uuidv4 } = require('uuid');
const fs = require("fs");
const express = require("express");
const path = require("path");
const http = require("http");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 2000;
const io = require("socket.io")(server);
const gameSessions = {};

const { execFile } = require("child_process");

//serve static files from public folder
app.use(express.static(path.join(__dirname, "public")));




//AI endpoint
app.get("/getBestColumn", (req, res) => {
    let state = req.query.input || "default";
    if(state === "default") {state = "";}
    console.log("Column: ", state);
    //windows path: "public\\scripts\\webMinimax.exe"
    //linux path: "public/scripts/webMinimax.exe"
    execFile("public/scripts/webMinimax.exe", [state], (error, stdout, stderr) => {
        if (error) {
            console.error(error);
            return res.status(500).send("Error running C++ program");
        }
        console.log(stdout);
        return res.send(stdout.trim());
    });
});






//create multiplayer session
app.get('/create', (req, res) => {
    const {username} = req.query;
    const gameID = uuidv4();
    const playerID = uuidv4();

    gameSessions[gameID] = {
        players: [{id: playerID, name: username, socketID: null, number: 1, newGameRequest: false}],  
        board: Array(6).fill(null).map(() => Array(7).fill(null)),
        currentTurn: 1,
        gameOver: false,
        win: null,
        winner: null
    };

    res.json({
        joinUrl: `/join/${gameID}`,
        playerID: playerID, 
		gameID: gameID
    });
});


//serve multiplayer game page
app.get('/join/:gameId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'multiplayerGame.html'));
});



//socket.IO handling
io.on("connection", (socket) => {
    console.log("New socket connected: ", socket.id);


    socket.on("joinSession", ({ gameID, playerID, username }) => {
        console.log(`Player {${username}} with ID {${playerID}} attempted to join game {${gameID}}`);

        const game = gameSessions[gameID];
        if (!game) {
            socket.emit("errorMessage", "Game not found.");
            return;
        }

        const existingPlayer = game.players.find(p => p.id === playerID);
        if (existingPlayer) {
            //rejoin logic
            existingPlayer.socketID = socket.id;
            socket.join(gameID);
            console.log(`${username} rejoined game ${gameID}`);
            if (game.players.length !== 1) {io.to(gameID).emit("gameState", game);}
            return; 
        }

        //check if game is full
        if (game.players.length >= 2) {
            socket.emit("errorMessage", "Game is full.");
            return;
        }

        //add new player
        const newPlayer = { id: playerID, name: username, socketID: socket.id , number: 2, newGameRequest: false};
        game.players.push(newPlayer);
        socket.join(gameID);
        console.log(`${username} joined game ${gameID}`);

        if (game.players.length === 2) {
            io.to(gameID).emit("gameStart", {
                players: game.players,
                currentTurn: game.currentTurn,
                board: game.board
            });
        }
    });


	//handle incoming move requests
	socket.on("makeMove", ({ column, gameID }) => {

		//only play moves if the game isn't over
		if(!gameSessions[gameID].gameOver){
			console.log("Move request received!");
			let data = move_manager(column, gameID, socket);
            if(data.length === 1 && data[0] !== null) {
                //send position to all clients
                io.to(gameID).emit("targetRow", {
                    targetRow: data[0],
                    column: column
                });
            }
            else {
                //move not accepted
            }
		}
	});



    //delete empty game sessions and manage reconnections
    socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);

        //locate the player who disconnected
        for (const [gameID, session] of Object.entries(gameSessions)) {
            const index = session.players.findIndex(p => p.socketID === socket.id);

            if (index !== -1) {
                //temporarily mark the player as disconnected
                session.players[index].socketID = null;
                console.log(`Marked player ${session.players[index].name} as disconnected in game ${gameID}`);

                //delete session if no players remain inside
                const someoneConnected = session.players.some(p => p.socketID !== null);
                if (!someoneConnected) {
                    delete gameSessions[gameID];
                    console.log(`Deleted game session ${gameID} — no active players.`);
                } else {
                    //notify remaining player that someone left
                    io.to(gameID).emit("playerLeft", { playerName: session.players[index].name });
                }

                break;
            }
        }
    });



    socket.on("newGameRequest", ({ gameID, currentPlayerOnClient}) => {
        //set player to requesting for a new game

        const game = gameSessions[gameID];
        game.players[currentPlayerOnClient-1].newGameRequest = true;

        //check if both players want a new game
        if (game.players[0].newGameRequest === true && game.players[1].newGameRequest === true) {
            //restart game and all data
            game.players[0].newGameRequest = false;
            game.players[1].newGameRequest = false;

            game.win = null;
            game.winner = null;

            game.board = Array(6).fill(null).map(() => Array(7).fill(null));
            game.gameOver = false;

            //randomly assigns the turn
            game.currentTurn = Math.floor(Math.random() * 2) + 1;

            console.log("Game being restarted!");
            io.to(gameID).emit("newGame", (game));
        }
        else {
            //notify all that the game restart queue is 1/2
            io.to(gameID).emit("newGameRequestAccepted");
        }
    });

});





















//404 fallback
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, "public", "error.html"));
});


server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});












//multiplayer game functions
function move_manager(column, gameID, socket) {
	let gameBoard = gameSessions[gameID].board;

	//only run if the column isn't full
	if(gameBoard[0][column] === null) {
		
		let targetRow = 0;
		for (let row = 5; row > 0; row--) {
			if (gameBoard[row][column] === null) {
				targetRow = row;
				break;
			}
		}
        let piece = '';
        if (gameSessions[gameID].currentTurn === 1) {
            piece = 'x';
            gameSessions[gameID].currentTurn = 2;
        }
        else {piece = 'o'; gameSessions[gameID].currentTurn = 1;}
        
        //update gameboard
        gameBoard[targetRow][column] = piece;


        if(find_winner(gameBoard) !== null) {

            //end game
            gameSessions[gameID].gameOver = true;
            let win = find_winner(gameBoard);
            gameSessions[gameID].win = win;
            io.to(gameID).emit("gameOver", { result : win, players: gameSessions[gameID].players });
        }
        else if(board_is_full(gameBoard)) {
            gameSessions[gameID].gameOver = true;
            gameSessions[gameID].winner = "Draw";
            io.to(gameID).emit("gameDraw", {});
        }

        //return target row back to client
		return [targetRow];
	}
	else {
		//move not accepted
        return [null];
	}

}

function board_is_full(board) {
	for (let row of board) {
		for (let item of row) {
			if (item === null) {
				return false;
			}
		}
	}
	return true;
}

function find_winner(gameBoard) {
    const numRows = 6;
    const numCols = 7;

    const directions = [
        [0, 1],   // →
        [1, 0],   // ↓
        [1, 1],   // ↘
        [1, -1],  // ↙
    ];

    function hasFourInARow(startRow, startCol, dRow, dCol) {
        const first = gameBoard[startRow]?.[startCol];
        if (first === null || first === undefined) return null;

        const positions = [[startRow, startCol]];

        for (let step = 1; step < 4; step++) {
            const r = startRow + dRow * step;
            const c = startCol + dCol * step;

            if (
                r < 0 || r >= numRows ||
                c < 0 || c >= numCols ||
                gameBoard[r]?.[c] !== first
            ) {
                return null;
            }

            positions.push([r, c]);
        }

        return positions;
    }


    for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < numCols; c++) {
            for (const [dRow, dCol] of directions) {
                const win = hasFourInARow(r, c, dRow, dCol);
                if (win) return win;
            }
        }
    }

    return null;
}

