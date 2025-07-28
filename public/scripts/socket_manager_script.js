//host player will automatically be kicked if page is refeshed whilst waiting for the second player to join

const socket = io();

//keep track of which player is on the current client
let currentPlayerOnClient = 0;

//keep track of whose current move it is
let playerMove = 1; //let's keep it as player 1 starts first; this will be changed if the player wishes to restart the game

//keep track of player data
let players;
let currentColumn;

socket.on("gameStart", (data) => {
    players = data.players;
    console.log("Game has started!");
    document.getElementById("waitingScreenContainer").style.display = "none";
    
    //handle UI
    generateBoard();
    position_UI();
    
    //notify whose turn it is
    if(playerMove === 1) {turnTracker.innerHTML =`${players[0].name} is playing`;}
    else {turnTracker.innerHTML =`${players[1].name} is playing`;}

    //update UI with player usernames
    players = data.players;
    const player1Username = players[0].name;
    const player2Username = players[1].name;

    document.getElementById("player1").innerHTML = player1Username + ": " + "🔵";
    document.getElementById("player2").innerHTML = player2Username + ": " + "🟠";
    
});

const urlParts = window.location.pathname.split('/');
const gameID = urlParts[urlParts.length - 1];


document.addEventListener("DOMContentLoaded", () => {

	let playerID = localStorage.getItem("playerID");
	let username = localStorage.getItem("username");

    //check if player 2 is returning or joining a new game
    let lastGameID = localStorage.getItem("lastGameID");
    let newPlayer = false;
    if (lastGameID !== gameID) {newPlayer = true;}

	if (!playerID || newPlayer) {
		//alert("Hello player 2 :)");

		document.getElementById("waitingScreenStartGame").style.display = "none";
		document.getElementById("waitingScreenUsernameCheck").style.display = "block";

        currentPlayerOnClient = 2;
	} else {
        currentPlayerOnClient = 1;
		join_session(gameID, playerID, username);
	}
});



//setup socket connection
function join_session(gameID, playerID, username) {
    socket.emit("joinSession", { gameID, playerID, username });
}


//handle if session is full
socket.on("sessionFull", () => {
    alert("This session is already full. Please try a different link.");
    window.location.href = "/index.html";
});


//handle successful join
/*
socket.on("sessionJoined", (data) => {
    console.log("Successfully joined game session", data);
    // Hide waiting screen if second player joined
    document.getElementById("waitingScreenContainer").style.display = "none";
    // Initialize game state, set opponent name, etc.
});
*/



//handle game over 
socket.on("gameOver", (data) => {
    display_win(data.result, data.players);
});


//used to resume the game after a pause
socket.on("gameState", (data) => {
    players = data.players;
    playerMove = data.currentTurn;
    let gameBoard = data.board;
    const turnTracker = document.getElementById("turnTracker");

    //notify whose turn it is
    if(playerMove === 1) {turnTracker.innerHTML =`${players[0].name} is playing`;}
    else {turnTracker.innerHTML =`${players[1].name} is playing`;}

    document.getElementById("waitingScreenContainer").style.display = "none";




    if(data.players[0].id === localStorage.getItem("playerID")) {currentPlayerOnClient = 1;}
    else {currentPlayerOnClient = 2;}
    
    //update UI
    document.getElementById("waitingScreenContainer").style.display = "none";
    document.getElementById("player1").innerHTML = data.players[0].name + ": " + "🔵";
    document.getElementById("player2").innerHTML = data.players[1].name + ": " + "🟠";

    generateBoard();
    load_game(gameBoard);

    if (data.win !== null) {
        //winner found
        display_win(data.win, data.players);
    }
    else if (data.gameOver) {
        document.getElementById("winningMessage").innerHTML = "It's a draw";
        document.getElementById("winningMessage").style.display = "block";
    }

});



socket.on("playerLeft", (data) => {
    let username = data.playerName;
    let waitingMessageContainer = document.getElementById("waitingMessage")
    waitingMessageContainer.innerHTML = `Opponent <i style="color: #0191b2;">${username}</i> has left the session. Waiting for a reconnection.`;

    //make the UI seen
    document.getElementById("waitingScreenStartGame").style.display = "none";
    document.getElementById("waitingScreenUsernameCheck").style.display = "none";
    document.getElementById("waitingMessageContainer").style.display = "block";

    document.getElementById("waitingScreenContainer").style.display = "flex";
});




//handle approve move responses
socket.on("targetRow", (data) => {
    let row = data.targetRow;
    currentColumn = data.column;

    console.log("Move approved!");
    console.log("Target row: ", row);

    let color;
    if (playerMove === 1) {
        color = "#46E9FF";
        //switch to next player
        playerMove = 2;
    }
    else {
        color = "#FF7607";
        //switch to next player
        playerMove = 1;
    }

    //drop tile
    drop_piece(color, currentColumn, row);

    //notify whose turn it is
    if(playerMove === 1) {turnTracker.innerHTML =`${players[0].name} is playing`;}
    else {turnTracker.innerHTML =`${players[1].name} is playing`;}
});



//handle draws
socket.on("gameDraw", (data) => {
    document.getElementById("winningMessage").innerHTML = "It's a draw!";
    document.getElementById("winningMessage").style.display = "block";
    document.getElementById("turnTracker").style.display = "none";
});



//handle error messages
socket.on("errorMessage", (data) => {
    window.location.href = "/error.html";
});




//alert the current game restart queue
socket.on("newGameRequestAccepted", (data) => {
    document.getElementById("newGame").innerHTML = `New Game<br>queue: 1/2<br>`;
});

//handle new game
socket.on("newGame", (game) => {
    document.getElementById("newGame").innerHTML = `New Game`;
    playerMove = game.currentTurn;
    let gameBoard = [
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0]
    ];

    generateBoard();
    gameOver = false;

    document.getElementById("winningMessage").style.display = "none";

    //notify whose turn it is
    const turnTracker = document.getElementById("turnTracker");
    turnTracker.style.display = "block";
    if(playerMove === 1) {turnTracker.innerHTML =`${players[0].name} is playing`;}
    else {turnTracker.innerHTML =`${players[1].name} is playing`;}
});




function check_username() {
    const username = document.getElementById("usernameInput").value;
    if(username !== "") {
        document.getElementById("errorMessage").style.display = "none";
        document.getElementById("submitButton").innerHTML = "Processing...";
        const playerID = crypto.randomUUID();
        localStorage.setItem("username", username);
        localStorage.setItem("playerID", playerID);
        localStorage.setItem("lastGameID", gameID);
        join_session(gameID, playerID, username);

    }
    else {document.getElementById("errorMessage").style.display = "block";}
}

function generateBoard() {
    const board = document.getElementById("board");
    const container = document.getElementById("board-container");
    board.innerHTML = "";

    const rows = 6;
    const cols = 7;

    //remove any old cells if any
    const oldCells = container.querySelectorAll(".cell");
    oldCells.forEach(c => c.remove());

    //generate cells
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.classList.add("piece-pop");
        board.appendChild(cell);
        }
    }


    //remove old clickers if any
    const oldClickers = container.querySelectorAll(".column-clicker");
    oldClickers.forEach(c => c.remove());



    //add column clickers
    for (let col = 0; col < cols; col++) {
        const clicker = document.createElement("div");
        clicker.className = "column-clicker";
        clicker.style.width = `calc(100% / 7)`;
        clicker.style.left = `calc((100% / 7) * ${col+0.05}`;


        //click event
        clicker.addEventListener("click", () => {
            console.log("Column clicked: " + col);
            //check if column isn't full
            if (gameBoard[0][col] === 0 && gameOver === false) {request_move(col);}
        });



        if (col === 0) {
            clicker.style.width = `calc((108% / 7)`;
            clicker.style.borderTopLeftRadius = "15px";
            clicker.style.borderBottomLeftRadius = "15px";
            clicker.style.left = `calc((100% / 7) * ${col}`;
        }
        else if (col === 1) {clicker.style.left = `calc((100% / 7) * ${col+0.06}`;}
        else if (col === 2) {clicker.style.left = `calc((100% / 7) * ${col+0.045}`;}
        else if (col === 3) {clicker.style.left = `calc((100% / 7) * ${col+0.025}`;}
        else if (col === 4) {clicker.style.left = `calc((100% / 7) * ${col+0.01}`;}
        else if (col === 5) {clicker.style.left = `calc((100% / 7) * ${col+0.0005}`;}
        else if (col === 6) {
            clicker.style.width = `calc((102% / 7)`;
            clicker.style.borderTopRightRadius = "15px";
            clicker.style.borderBottomRightRadius = "15px";
            clicker.style.left = `calc((99.5% / 7) * ${col}`;
        }

        container.appendChild(clicker);
    }
}

function drop_piece(color, column, row) {
    const container = document.getElementById("board-container");

    //cue falling animation
    const fallingPiece = document.createElement("div");
    fallingPiece.className = "falling-piece";
    fallingPiece.style.width = `calc(93% / 7)`;
    fallingPiece.style.height = `calc(109% / 7)`;
    fallingPiece.style.bottom = `calc(95%)`;

    let left = "10px";
    switch(column) {
        case 0: left = `calc(1.5%)`; break;
        case 1: left = `calc(15.5%)`; break;
        case 2: left = `calc(29.5%)`; break;
        case 3: left = `calc(43.5%)`; break;
        case 4: left = `calc(58%)`; break;
        case 5: left = `calc(72%)`; break;
        case 6: left = `calc(85.5%)`;
    }
    fallingPiece.style.left = left;
    fallingPiece.style.backgroundColor = color;
    container.appendChild(fallingPiece);
    


    //trigger animation
    //set custom property for fall distance
    let distance;
    switch (row) {
        case 0: distance = `calc(77%)`; break;
        case 1: distance = `calc(180%)`; break;
        case 2: distance = `calc(285%)`; break;
        case 3: distance = `calc(390%)`; break;
        case 4: distance = `calc(495%)`; break;
        case 5: distance = `calc(600%)`; break;
    }


    fallingPiece.style.setProperty("--fall-distance", `${distance}`);
    //clear falling tile
    
    //wait until tile has fallen
    setTimeout(() => {
        fallingPiece.remove();

        //set tile in place
        const cell = document.querySelector(`[data-row="${row}"][data-col="${column}"]`);
        cell.style.backgroundColor = color;
        

        //restart animation
        cell.classList.remove("piece-pop");
        void cell.offsetWidth;

        cell.classList.add("piece-pop");

        //cleanup animation after use
        setTimeout(() => {
            cell.classList.remove("piece-pop");
        }, 300);
    }, 400);
    
}

function request_move(column) {
    //it is the current player's turn
    console.log(playerMove);
    if(currentPlayerOnClient === playerMove) {
        const gameID = localStorage.getItem("lastGameID"); 
        currentColumn = column;
        //console.log(gameID);
        socket.emit("makeMove", {column, gameID});
    }
}

function display_win(win, players) {
    let row;
    let column;
    for(let position of win) {
        row = parseInt(position[0]);
        column = parseInt(position[1]);
        const cell = document.querySelector(`[data-row="${row}"][data-col="${column}"]`);
        cell.style.backgroundImage = "url('/images/winMask.png')";
        cell.style.backgroundSize = "cover";
        cell.style.backgroundRepeat = "no-repeat";
        cell.style.backgroundPosition = "center";
        cell.style.backgroundSize = "90%";
        
    }
    gameOver = true;
    
    if(gameBoard[row][column] === 'x') {document.getElementById("winningMessage").innerHTML = players[1].name + " has won";}
    else {document.getElementById("winningMessage").innerHTML = players[0].name + " has won";}
    document.getElementById("winningMessage").style.display = "block";
    document.getElementById("turnTracker").style.display = "none";
}

function load_game(gameboard) {
    for (let column = 0; column < 7; column++) {
        for (let row = 0; row < 6; row++) {
            let color = null;
            if (gameboard[row][column] === 'x') {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${column}"]`);
                cell.style.backgroundColor = "#46E9FF";
            }
            else if (gameboard[row][column] === 'o') {
                const cell = document.querySelector(`[data-row="${row}"][data-col="${column}"]`);
                cell.style.backgroundColor = "#FF7607";
            }
        }
    }
}

function restart_game() {
    socket.emit("newGameRequest", {gameID, currentPlayerOnClient});
}

let gameOver = false;
let turn = 0;
let state = "";
let gameBoard = [
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0]
];