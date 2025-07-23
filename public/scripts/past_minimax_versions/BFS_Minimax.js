
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









/*
First move: '000000' or '100000' or '200000' or '300000' or '400000' or '500000' or '600000'


*/

//generating initial queue -- this will only have to be generated once
const initialQueue = generate_initial_queue();




function generate_initial_queue() {
  let queue = [];

  for (let i=0; i<7; i++) {
    for (let j=0; j<7; j++) {
      for (let k=0; k<7; k++) {
        for (let l=0; l<7; l++) {
          for (let m=0; m<7; m++) {
            
            for (let n=0; n<7; n++) {
                //appending the state to the queue
                state=i.toString() + j.toString() + k.toString() + l.toString() + m.toString()+ n.toString();
                queue.push(state);
            }
            /*
            state=i.toString() + j.toString() + k.toString() + l.toString() + m.toString();
            queue.push(state);
            */
            
          }
        }
      }
    }
  }
  


  return queue;
}

var boardPosition='333334444410111322212522541550';

const Time=Date.now();
let column=minimax(boardPosition, 6, initialQueue);
console.log('Column to select:', column)
console.log('Time taken to calculate minimax:', Date.now()-Time, 'ms');

function minimax(state, depth, queue) {

    if(depth===6) {
        let t=Date.now();
        let scores=[];
        for (let index=0; index<queue.length; index++) {

            //if the move is illegal, then the recent position in the move should be reveresed until the move is valid
            // this is to ensure that the minimax algorithm does not consider illegal moves

            let position=state+queue[index];
            while (check_state_validity(position)===false) {
                //removing the last move in position
                position=position.slice(0,position.length-1);
            }
           
            scores.push(get_score(position));
        }
        queue=scores;
        console.log('Time taken to calculate scores:', Date.now()-t, 'ms');
    }


    let newQueue=[]; //new queue to be returned
    let score=0;
    let count=0;

    for (let i=0; i<(queue.length); i=i+7) {
        window=[queue[i], queue[i+1], queue[i+2], queue[i+3], queue[i+4], queue[i+5], queue[i+6]];
        count++;
        //check if the current depth allows the player to choose a column


        //minimzing player chooses a column if depth is odd
        if (depth%2!==0) {
            //choosing the minimum score from the current window
            score=Math.min(...window);
        }

        //maximizing player chooses a column if depth is even
        else {score=Math.max(...window);}

        //appending the score to the new queue
        newQueue.push(score);
    }

    if (depth===3) {console.log(queue[0], queue[queue.length-1]);}
    if(depth!=2) {
        return minimax(state, depth-1, newQueue);
    }
    else {
        console.log(newQueue);
        //find the column with the maximum score
        
        
        //find index of valid max score
        //this is to ensure that the column is valid i.e. not full
        let valid=false;
        while (valid===false) {
            //console.log('New queue:', newQueue);
            let maxScoreIndex=newQueue.indexOf(Math.max(...newQueue));

            //check if the column is valid
            if (convert_state_to_matrix(state)[0][maxScoreIndex]===0) {
                return maxScoreIndex; //return the column index
            }
            else {
                //remove the max score from the queue
                newQueue[maxScoreIndex]=Number.NEGATIVE_INFINITY; //set it to negative infinity so that it is not considered in the next iteration
            }
        }
    
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
    count=0;
    for (let column=0; column<(7-3); column++) {
        for (let row=3; row<6; row++) {

            //generating 4-cell scoring window
            let window=[[row, column],
                        [row-1, column+1],
                        [row-2, column+2],
                        [row-3, column+3]];
            count++;

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

    //checking if window is filled with '0's, and if it it, return 0
    
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
    else {
        console.log(3);
        centerColumnWeightage=5;

        computerWinWeightage=1000000;
        computer3InARowWeightage=100;
        computer2InARowWeightage=10;

        playerWinWeightage=-2000000;
        player3InARowWeightage=-300;
        player2InARowWeightage=-100;
    }
    return [centerColumnWeightage, computerWinWeightage, computer3InARowWeightage, computer2InARowWeightage, playerWinWeightage, player3InARowWeightage, player2InARowWeightage];
}





