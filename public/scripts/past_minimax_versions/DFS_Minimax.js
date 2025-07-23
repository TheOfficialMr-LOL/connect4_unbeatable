
/*

'x' will represent the computer 
'o' will represent the player



The computer will always start first
The computer will use the minimax algorithm along with alpha-beta pruning to find the best move



Connect 4 board

0 0 0 0 0 0 0 
0 0 0 0 0 0 0 
0 0 0 0 0 0 0 
0 0 0 o 0 0 0 
0 0 0 x 0 0 0 
0 0 0 o 0 0 0 

00000
*/

boardPosition=''; //this will be used to store the current state of the board after the computer occupies the middle column
let depth=6; //this is the depth of the minimax algorithm
const Time=Date.now();
console.log('Best column to play in: ' + get_best_column(boardPosition));
console.log('Time taken: ' + (Date.now()-Time) + 'ms'); //print the time taken to find the best column

for (let i of convert_state_to_matrix(boardPosition)) {console.log(i);}




function get_best_column(state) {
    let queue=[];
    for (let column=0; column<7; column++) {
        queue.push(minimax(state + column.toString(), depth, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY, false)); 
    }
    console.log(queue); //print the queue of scores for each column

    //filter queue to remove +inf and -inf values
    //+inf == invalid moves
    // -inf == invalid moves
    for (let i=0; i<queue.length; i++) {
        if (queue[i]===Number.POSITIVE_INFINITY) {queue[i]=Number.NEGATIVE_INFINITY;}
    }


    return queue.indexOf(Math.max(...queue)); //return the index of the maximum value in the queue, which will be the best column to play in
}





function minimax(state, depth, alpha=Number.NEGATIVE_INFINITY, beta=Number.POSITIVE_INFINITY, maximizingPlayer) {

    //check if the current state is a terminal state
    //FUTURE: check if there is a winnner in the current state

    if (depth===0 || check_win(state)) {
        return get_score(state); //return the score of the current state
    }


    if (maximizingPlayer) {
        //maximizing player is the computer
        let maxEval=Number.NEGATIVE_INFINITY;

        for (let column=0; column<7; column++) {
            let newState=state + column.toString(); //appending the column to the state
            //check if the new state is valid
            if (check_state_validity(newState)) {
                
                let eval=minimax(newState, depth-1, alpha, beta, false); //recursive call to minimax with the new state
                maxEval=Math.max(maxEval, eval); //update the maximum evaluation
                alpha=Math.max(alpha, eval); //update alpha
                if (beta <= alpha) {
                    break; //prune nodes
                }
            }
        }
        return maxEval; //return the maximum evaluation
    }
    else {
        //minimizing player is the player
        let minEval=Number.POSITIVE_INFINITY;

        for (let column=0; column<7; column++) {
            let newState=state + column.toString(); //appending the column to the state
            //check if the new state is valid
            if (check_state_validity(newState)) {
                
                let eval=minimax(newState, depth-1, alpha, beta, true); //recursive call to minimax with the new state
                minEval=Math.min(minEval, eval); //update the minimum evaluation
                beta=Math.min(beta, eval); //update beta
                if (beta <= alpha) {
                    break; //prune nodes
                }
            }

        }

        return minEval; //return the minimum evaluation
    }
}


















/*
This function calculates the score of the last move made in the game.
It checks the last move made and generates a scoring list in all four directions:
1. Horizontal
2. Vertical
3. Diagonal (both directions)
It then calculates the score based on the number of consecutive pieces in each direction.
*/

function get_score(state) {
    let board=convert_state_to_matrix(state);
    let finalScore=0; //final score to be returned


    //generating scoring list in each direction

    //horizontal windows
    for (let column=0; column<(7-3); column++) {
        for (let row=0; row<6; row++) {

            //generating 4-cell scoring window
            let window=[[row, column],
                        [row, column+1],
                        [row, column+2],
                        [row, column+3]];

            //evaluating score based on the current window
            finalScore+=evaluate_score_based_on_window(board, window, state);
        }
    }
    

    //vertical windows
    for (let column=0; column<7; column++) {
        for (let row=0; row<(6-3); row++) {

            //generating 4-cell scoring window
            let window=[[row, column],
                        [row+1, column],
                        [row+2, column],
                        [row+3, column]];

            //evaluating score based on the current window
            finalScore+=evaluate_score_based_on_window(board, window, state);
        }
    }


    //diagonal window \
    for (let column=0; column<(7-3); column++) {
        for (let row=0; row<(6-3); row++) {

            //generating 4-cell scoring window
            let window=[[row, column],
                        [row+1, column+1],
                        [row+2, column+2],
                        [row+3, column+3]];

            //evaluating score based on the current window
            finalScore+=evaluate_score_based_on_window(board, window, state);
        }
    }


    //diagonal window /
    for (let column=0; column<(7-3); column++) {
        for (let row=3; row<6; row++) {

            //generating 4-cell scoring window
            let window=[[row, column],
                        [row-1, column+1],
                        [row-2, column+2],
                        [row-3, column+3]];

            //evaluating score based on the current window
            finalScore+=evaluate_score_based_on_window(board, window, state);
        }
    }



    //count cells in the centre column
    let centreColumnCount=0;
    for (let row=0; row<6; row++) {
        if (board[row][3]==='x') {centreColumnCount++;}
    }


    //applying scoring heuristic for centre column
    let centerColumnWeightage=dynamic_scoring(state)[0];
    finalScore+=(centreColumnCount*centerColumnWeightage); //centre column weightage is multiplied by the number of pieces in the centre column


    //returning final score
    return finalScore;

}







/*
This function evaluates the score of a given window of cells in the Connect 4 board.
It checks the number of 'x' and 'o' pieces in the window and applies scoring heuristics based on the number of 
consecutive pieces.
It returns a score based on the heuristics defined.

Future changes: 
- Add more heuristics for scoring (more points for centre column?)
- dynamic scoring perhaps

*/


function evaluate_score_based_on_window(board, window, state) {


    //retrieving scoring dynamic heuristics
    scoringHeuristic=dynamic_scoring(state); //dynamic scoring based on the current window
    let xWinWeightage=scoringHeuristic[1];
    let x3InARowWeightage=scoringHeuristic[2];
    let x2InARowWeightage=scoringHeuristic[3];

    let oWinWeightage=scoringHeuristic[4];
    let o3InARowWeightage=scoringHeuristic[5];
    let o2InARowWeightage=scoringHeuristic[6];




    let score=0;

    //checking if window is filled with '0's, and if it is, return 0
    
    let zeroCount=0;
    for (let cell of window) {
        let row=cell[0];
        let column=cell[1];

        if(board[row][column]===0) {zeroCount++;}
    }
    if (zeroCount===4) {return 0;} //if the window is empty, return 0
    
    


    //tabulating the number of 'x' and 'o' in the current window
    let xCount=0;
    let oCount=0;

    //looping through each cell in the window
    for (let cell of window) {

        let row=cell[0];
        let column=cell[1];

        if(board[row][column]==='x') {xCount++;}
        else if(board[row][column]==='o') {oCount++;}
    }

    //applying scoring heuristics

    //checking if the current window is 'pure' -- this means that it only has one type of piece and the rest are empty
    if (xCount===0 || oCount===0) {
        //pure window
        //begin applying scoring heuristics
        
        if (xCount===4) {score+=xWinWeightage;} //4 in a row for the computer
        else if (oCount===4) {score+=oWinWeightage;} //4 in a row for the player
        else if (xCount===3) {score+=x3InARowWeightage;} //3 in a row for the computer
        else if (oCount===3) {score+=o3InARowWeightage;} //3 in a row for the player
        else if (xCount===2) {score+=x2InARowWeightage;} //2 in a row for the computer
        else if (oCount===2) {score+=o2InARowWeightage;} //2 in a row for the player
    }

    //console.log(score);
    return score;

}








//convert state into matrix
function convert_state_to_matrix(state) {

    
    let board=[
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0]
    ];

    //state: 01
    //we will assume that it is the computer's turn when turn is divisible by 2
    let turn=0;

    for (let i of state) {
        let column=parseInt(i);

        //checking if the column is full
        for (let row=5; row>=0; row--) {
            if(board[row][column]===0) {
                if(turn%2!==0) {board[row][column]='o';}
                else {board[row][column]='x';}
                turn++;
                break;
            }
        }
    }
    
 
   return board;
    
}



//this function checks if there are any illegal moves in the current state i.e. if there are any columns that are full
function check_state_validity(state) {

    //frequency of column selection will be counted, and if it exceeds 6, then the state is invalid
    for (let i=0; i<7; i++) {
        let targetChar=i.toString();
        let count=[...state].filter(char => char===targetChar).length;
        if (count>6) {
            return false; //invalid state
        }
    }
    return true; //valid state
}


//this function checks if there is a winner in the current state
// it will be used to check if the game is over to ensure no illegal moves are made
function check_win(state) {

    //determine whetherthe last move made was by the computer or the player
    //if the length of the state is even, then it is the computer's turn and vice-versa
    let turn=state.length%2; //0 for player, 1 for computer
    let piece;
    if (turn!==0) {piece='x';} 
    else {piece='o';} 



    let board=convert_state_to_matrix(state);

    //finding the position of the last move made
    let columnOriginal=parseInt(state[state.length-1]);
    let position=[-1, columnOriginal];

    for (let row=0; row<6; row++) {
        if (board[row][columnOriginal]!==0) {
            position[0]=row;
            break;
        }
    }

    //console.log('position:',position);





    //horizontal window
    let row=position[0];
    let windowHorizontal=[];
    for (let columnIncrement=-3; columnIncrement<=3; columnIncrement++) {
        let column=position[1]+columnIncrement;
        if (column>=0 && column<7) {
            windowHorizontal.push(board[row][column]);
        }
    }
    //check for winner
    if (check_window(windowHorizontal, piece)) {return true;} //winner found
    






    //vertical window
    let column=position[1];
    let windowVertical=[];
    for (let rowIncrement=-3; rowIncrement<=3; rowIncrement++) {
        let row=position[0]+rowIncrement;
        if (row>=0 && row<6) {
            windowVertical.push(board[row][column]);
        }
    }
    //check for winner
    if (check_window(windowVertical, piece)) {return true;} //winner found







    //diagonal window \
    let windowDiagonal1=[];
    for (let increment=-3; increment<=3; increment++) {
        let row=position[0]+increment;
        let column=position[1]+increment;
        if (row>=0 && row<6 && column>=0 && column<7) {
            windowDiagonal1.push(board[row][column]);
        }
    }
    //check for winner
    if (check_window(windowDiagonal1, piece)) {return true;} //winner found






    //diagonal window /
    let windowDiagonal2=[];
    for (let increment=-3; increment<=3; increment++) {
        let row=position[0]-increment;
        let column=position[1]+increment;
        if (row>=0 && row<6 && column>=0 && column<7) {
            windowDiagonal2.push(board[row][column]);
        }
    }
    //check for winner
    if (check_window(windowDiagonal2, piece)) {return true;} //winner found

    //if no winner found, return false
    return false;
}

console.log(check_win('3434343'));
//sub procedure to check the winner in the current state
function check_window(window, piece) {
    let count=0
    for (let cell of window) {
        if (cell===piece) {
            count++;
            if(count===4) {
                return true; //winner found
            }
        }
        else {count=0;}
    }
    return false; //no winner found
}





//this function will be used to dynamically alter scores based on the current board state
// it will be used to adjust the scoring heuristics based on the current board state

function dynamic_scoring(state) {
    
    //the '6' in the calculation is the number of moves ahead that the algorithm will consider 
    // this value may change based on the depth of the minimax algorithm
    let depth=6; //this is the depth of the minimax algorithm

    let centerColumnWeightage;
    let computerWinWeightage;
    let computer3InARowWeightage;
    let computer2InARowWeightage;
    let playerWinWeightage;
    let player3InARowWeightage;
    let player2InARowWeightage;

    
    if(boardPosition.length<=(5)) {
        //console.log(1);
        centerColumnWeightage=100;

        computerWinWeightage=1000000;
        computer3InARowWeightage=100;
        computer2InARowWeightage=10;

        playerWinWeightage=-2000000;
        player3InARowWeightage=-300;
        player2InARowWeightage=-3;
    }
    else if (boardPosition.length<=(57)) {
        //console.log(2);
        centerColumnWeightage=10;

        computerWinWeightage=1000000;
        computer3InARowWeightage=100;
        computer2InARowWeightage=50;

        playerWinWeightage=-2000000;
        player3InARowWeightage=-200;
        player2InARowWeightage=-20;
    }
    else if (boardPosition.length<=(30)) {
        //console.log(2);
        centerColumnWeightage=10;

        computerWinWeightage=1000000;
        computer3InARowWeightage=300;
        computer2InARowWeightage=50;

        playerWinWeightage=-2000000;
        player3InARowWeightage=-500;
        player2InARowWeightage=-20;
    }
    
    return [centerColumnWeightage, computerWinWeightage, computer3InARowWeightage, computer2InARowWeightage, playerWinWeightage, player3InARowWeightage, player2InARowWeightage];
}



