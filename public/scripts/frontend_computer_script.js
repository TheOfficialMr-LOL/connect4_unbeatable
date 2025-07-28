
//when the turn is even, it will be the computer's turn
//when the turn is odd, it will be the player's turn
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

function generateBoard() {
    const board = document.getElementById("board");
    const container = document.getElementById("board-container");
    board.innerHTML = "";

    const rows = 6;
    const cols = 7;

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
            if (gameBoard[0][col] === 0 && gameOver === false && turn % 2 !=0) {move_manager(col);}
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




function move_manager(column) {
    const positionTracker = document.getElementById("positionTracker");

    //get row
    let targetRow = 0;
    let color = '#FF7607';
    for (let row = 5; row > 0; row--) {
        if (gameBoard[row][column] == 0) {
            targetRow = row;
            break;
        }
    }
    console.log("Target row: ", targetRow);


    //update the board accordingly
    if (turn % 2 == 0) {
        gameBoard[targetRow][column] = 'x';
        color = '#46E9FF';
        state += (column+1).toString();
        positionTracker.innerHTML = "Position: " + state;
        turn++;
    }
    else {
        gameBoard[targetRow][column] = 'o';
        state += (column+1).toString();
        positionTracker.innerHTML = "Position: " + state;
        turn++;

        //check if game is a draw
        if (state.length !== 42) {
            getBestColumn();
        }
        else {
            gameOver = true;
            let winningMessage = document.getElementById("winningMessage");
            winningMessage.innerHTML = "It's a draw";
            winningMessage.style.display = "block";
        }
    }
    drop_piece(color, column, targetRow);

    //end game if winner found
    let win = find_winner();
    if(win !== null) {
        let row;
        let column;
        for(let position of win) {
            row = position[0];
            column = position[1];
            const cell = document.querySelector(`[data-row="${row}"][data-col="${column}"]`);
            cell.style.backgroundImage = "url('images/winMask.png')";
            cell.style.backgroundSize = "cover";
            cell.style.backgroundRepeat = "no-repeat";
            cell.style.backgroundPosition = "center";
            cell.style.backgroundSize = "90%";
        }
        gameOver = true;
        if(gameBoard[row][column] === 'x') {document.getElementById("winningMessage").innerHTML = "The computer has won";}
        else {document.getElementById("winningMessage").innerHTML = "The player has won";}
        document.getElementById("winningMessage").style.display = "block";
    }
}



function position_UI() {
    const positionTracker = document.getElementById("positionTracker");
    const board = document.getElementById("board-container");
    const boardWidth = board.offsetWidth;
    const boardLeft = board.getBoundingClientRect().left;
    positionTracker.style.left = `${boardLeft+1}px`;
    positionTracker.style.fontSize = `${boardWidth*0.025}px`;

    const returnToHome = document.getElementById("returnToHome");
    returnToHome.style.left = `${boardLeft+1}px`;
    returnToHome.style.fontSize = `${boardWidth*0.025}px`;


}
window.addEventListener('resize', position_UI);




function find_winner() {
    const numRows = 6;
    const numCols = 7;

    const directions = [
        [0, 1],   // →
        [1, 0],   // ↓
        [1, 1],   // ↘
        [1, -1],  // ↙
    ];

    function hasFourInARow(startRow, startCol, dRow, dCol) {
        const first = gameBoard[startRow][startCol];
        if (first === 0) return null;

        const positions = [[startRow, startCol]];

        for (let step = 1; step < 4; step++) {
            const r = startRow + dRow * step;
            const c = startCol + dCol * step;

            if (
                r < 0 || r >= numRows ||
                c < 0 || c >= numCols ||
                gameBoard[r][c] !== first
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



function getBestColumn() {
    fetch(`/getBestColumn?input=${encodeURIComponent(state)}`)
    .then(response => {
        if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
        }
        return response.text(); // or .json() if your server returns JSON
    })
    .then(data => {
        console.log("Best column:", data);
        const col = parseInt(data);
        move_manager(col);
    })
    .catch(error => {
        console.error("Fetch error:", error);
    });
}


getBestColumn();