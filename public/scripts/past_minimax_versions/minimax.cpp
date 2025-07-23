#include <iostream>
#include <string>
#include <cstring>
#include <vector>
#include <array>
#include <climits> //for INT_MAX and INT_MIN
#include <chrono> //for measuring execution time
#include <algorithm>
#include <bitset>
using namespace std;
using namespace std::chrono;

constexpr int MASK_COUNT = 69;
//the actual depth will be depth+1
constexpr int depth = 7;
typedef uint64_t bitboard;
using MaskArray = std::array<bitboard, MASK_COUNT>;



struct boards {
    bitboard gameBoard;
    bitboard playerBoard;
};


struct heuristics {
    int centerColumnWeightage;
    int computerWinWeightage;
    int computer3InARowWeightage;
    int computer2InARowWeightage;
    int playerWinWeightage;
    int player3InARowWeightage;
    int player2InARowWeightage;
};


heuristics beginning {
    100, 1000000, 100, 10, -2000000, -300, -3
};


heuristics midGame {
    10, 1000000, 100, 50, -2000000, -200, -20
};



//function initializations
boards convert_state_to_bitboard(int state[42]);
void processed_state(int (&state)[42], string currentPosition);
bool checkWin (bitboard bb);
bool columnFull(int array[42], int target);
string change_state(string state);
MaskArray generate_all_4_consecutive_bitmasks();

int count_open_cells(bitboard bb, bitboard gameBoard, const MaskArray &masks, int cellsOccupied);
int get_score(bitboard bb, bitboard gameBoard, const MaskArray masks, bool isMaximizingPlayer);
int get_best_column(int state[42], MaskArray &masks);
int minimax(int state[42], int currentDepth, int alpha, int beta, MaskArray &masks, bool maximizingPlayer);



//entry point

int main() {
    //start measuring time
	auto startTime = high_resolution_clock::now();



    MaskArray masks = generate_all_4_consecutive_bitmasks();
    string currentPosition = change_state("4744463621");

    int state[42]; fill(state, state + 42, -1); //create empty array of size 42 initialized to -1
    processed_state(state, currentPosition);


    boards bitboards = convert_state_to_bitboard(state);

    cout<<"Game board: ";
    cout<<bitset<64>(bitboards.gameBoard)<<endl;  // print the bitboard in binary format
    /*
    cout<<"Player board:"<<endl;
    cout<<endl<<bitset<64>(bitboards.playerBoard)<<endl;

    const bitboard computerBoard = bitboards.gameBoard ^ bitboards.playerBoard;
    const bitboard playerBoard = bitboards.playerBoard;
    const bitboard gameBoard = bitboards.gameBoard;
    cout<<"Computer board:"<<endl;
    cout<<bitset<64>(computerBoard)<<endl;

    if (checkWin(computerBoard)) {cout<<"The computer has won"<<endl;}
    if (checkWin(playerBoard)) {cout<<"The player has won"<<endl;}

    int threeCount = count_open_cells(computerBoard, gameBoard, masks, 3);
    int twoCount = count_open_cells(computerBoard, gameBoard, masks, 2);
    cout << "Open threes count: " << threeCount << endl;
    cout << "Open twos count: " << twoCount << endl;
    cout << "Computer score: " << get_score(computerBoard, gameBoard, masks, true) << endl;
    cout << "Player score: " << get_score(playerBoard, gameBoard, masks, false) << endl;
    */
    cout << "Best column to play: " << get_best_column(state, masks) << endl;
	auto stopTime = high_resolution_clock::now();
	auto duration = duration_cast<milliseconds>(stopTime - startTime);
	cout << "Program execution time: " << duration.count() << " milliseconds" << endl;
    /*
    bitboard playerBoard = convert_state_to_bitboard(state, heights);
    cout<<bitset<64>(playerBoard)<<endl;  // print the bitboard in binary format
    */
    return 0;
}





int get_best_column(int state[42], MaskArray &masks) {
    
    int queue[7] = {};

    //calculate move count
    int moveCount = 0;
    for (int col = 0; col < 42; ++col) {
        if (state[col] == -1) {break;}
        ++moveCount;
    }



    for (int column = 0; column < 7; ++column) {
        //mark column if column full
        if (columnFull(state, column)) {queue[column] = INT_MIN; continue;}

        int newState[42];
        memcpy(newState, state, sizeof(int) * 42);
        newState[moveCount] = column;

        queue[column] = minimax(newState, depth, INT_MIN, INT_MAX, masks, false); //calling minimax
    }

    //display queue
    cout << "Queue: ";
    for (int target : queue) {
        cout << target << ", ";
    }
    cout << endl;

    //filter queue to remove +inf and -inf values
    //+inf == invalid moves
    // -inf == invalid moves
	for (int i = 0; i < 7; i++) {
		if (queue[i] == INT_MAX) {queue[i] = INT_MIN;} //replace +inf with -inf
	}

    //return the index of the maximum element in the queue
	return max_element(queue, queue + 7) - queue;
}




bool columnFull(int array[42], int target) {
    int count = 0;
    for (int i = 0; i < 42; ++i) {
        if (array[i] == -1) {break;}
        if (array[i] == target) {++count;}
    }
    if (count >= 6) {return true;}
    return false;
}





//the maximizing player is the computer, and the minimizing player is the player

int minimax(int state[42], int currentDepth, int alpha, int beta, MaskArray &masks, bool maximizingPlayer) {
    //retrieve bitboards
    const boards bitboards = convert_state_to_bitboard(state);
    const bitboard computerBoard = bitboards.gameBoard ^ bitboards.playerBoard;
    const bitboard playerBoard = bitboards.playerBoard;
    const bitboard gameBoard = bitboards.gameBoard;

    //calculate move count
    int moveCount = __builtin_popcountll(gameBoard);

    //check if current state is either a terminal state or a win exists
    if (currentDepth == 0) {
        return get_score(playerBoard, gameBoard, masks, false) + get_score(computerBoard, gameBoard, masks, true);
    }
    else if (checkWin(computerBoard)) {return 1000000;}
    else if (checkWin(playerBoard)) {return -2000000;}



    //apply minimax
    if (maximizingPlayer) {
        int maxEval = INT_MIN;

        for (int column = 0; column < 7; ++column) {
            int newState[42];
            memcpy(newState, state, sizeof(int) * 42);
            newState[moveCount] = column;


            //check if state is valid
            bool valid = true;
            for (int col = 0; col < 7; ++col) {
                int count = 0;
                for (int i = 0; i < 42 && newState[i] != -1; ++i) {
                    if (newState[i] == col) {++count;}
                }
                if (count > 6) {valid = false; break;}
            }

            
            if(valid) {
                int eval = minimax(newState, currentDepth - 1, alpha, beta, masks, false);
                maxEval = max(maxEval, eval); //update maximum evaluation
				alpha = max(alpha, eval); //update alpha value
				if (beta <= alpha) {
					break; //beta cut-off (alpha-beta pruning)
				}
            }
        }
        return maxEval;
    }

    else {
        int minEval = INT_MAX;
        
        for (int column = 0; column < 7; ++column) {
            int newState[42];
            memcpy(newState, state, sizeof(int) * 42);
            newState[moveCount] = column;


            //check if state is valid
            bool valid = true;
            for (int col = 0; col < 7; ++col) {
                int count = 0;
                for (int i = 0; i < 42 && newState[i] != -1; ++i) {
                    if (newState[i] == col) {++count;}
                }
                if (count > 6) {valid = false; break;}
            }


            if (valid) {
                int eval = minimax(newState, currentDepth - 1, alpha, beta, masks, true);
                minEval = min(minEval, eval); //update minimum evaluation
				beta = min(beta, eval); //update beta value
				if (beta <= alpha) {
					break; //alpha cut-off (alpha-beta pruning)
				}
            }
        }
        return minEval;
    }
}






boards convert_state_to_bitboard(int state[42]) {
    int heights[7] = {0,0,0,0,0,0,0};

    bitboard gameBoard = 0; //empty bitboard with '0's
    bitboard playerBoard = 0;

    for (int index = 0; index < 42 && state[index] != -1; index++) {
        //update game board
        int column = state[index];
        int bitIndex = heights[column] + column * 7; //7 cells in a column
        gameBoard |= (1ULL << bitIndex);


        //update player board
        //the player will always play second
        if (index % 2 != 0) {
            int column = state[index];
            int bitIndex = heights[column] + column * 7; //7 cells in a column
            playerBoard |= (1ULL << bitIndex);
        }

        //update height
        heights[state[index]]++;
    }

    return {gameBoard, playerBoard};

}



void processed_state(int (&state)[42], string currentPosition) {
    for (int i = 0; i < currentPosition.length(); i++) {
        state[i] = currentPosition[i] - '0';
    }
}




bool checkWin (bitboard bb) {
    bitboard pair;
    //vertical check
    pair = bb & (bb >> 1);
    if (pair & (pair >> 2)) {return true;}

    //horizontal check
    pair = bb & (bb >> 7);
    if (pair & (pair >> 14)) {return true;}

    //diagonal check '\'
    pair = bb & (bb >> 6);
    if (pair & (pair >> 12)) {return true;}

    //diagonal check '/'
    pair = bb & (bb >> 8);
    if (pair & (pair >> 16)) {return true;}

    //if all the condition fail
    return false;
}






string change_state(string state) {
    string newPosition = "";
    for (char chr : state) {
        newPosition += to_string((chr - '0') - 1);
    }
    return newPosition;
}




//get the score of the current state


/*
this function counts the number of possible 3-in-a-rows and 2-in-a-rows
*/
int count_open_cells(bitboard bb, bitboard gameBoard, const MaskArray &masks, int cellsOccupied) {
    int count = 0;
    //count for 3-in-a-rows
    if (cellsOccupied == 3) {
        for (bitboard mask : masks) {
            if (__builtin_popcountll(bb & mask) == 3 && __builtin_popcountll(~gameBoard & mask) == 1) {
                count++;
            }
        }
    }
    //count for 2-in-a-rows
    else if (cellsOccupied == 2) {
        for (bitboard mask : masks) {
            if (__builtin_popcountll(bb & mask) == 2 && __builtin_popcountll(~gameBoard & mask) == 2) {
                count++;
            }
        }
    }
    return count;
}



//this function generates all 4-cell lines within the board
//each one of those lines can be checked to see if a 4-in-a-row or a 3-in-a-row exists

MaskArray generate_all_4_consecutive_bitmasks() {
    MaskArray masks{};
    int idx = 0;

    //horizontal masks
    for (int row = 0; row < 6; ++row) {
        for (int col = 0; col < 4; ++col) {
            bitboard mask = 0;
            for (int k = 0; k < 4; ++k)
                mask |= 1ULL << (row + (col + k) * 7);
            masks[idx++] = mask;
        }
    }


    //vertical masks
      for (int col = 0; col < 7; ++col) {
        for (int row = 0; row < 3; ++row) {
            bitboard mask = 0;
            for (int k = 0; k < 4; ++k)
                mask |= 1ULL << (row + k + col * 7);
            masks[idx++] = mask;
        }
    }


    //diagonal masks '/'
    for (int col = 0; col < 4; ++col) {
        for (int row = 0; row < 3; ++row) {
            bitboard mask = 0;
            for (int k = 0; k < 4; ++k)
                mask |= 1ULL << (row + k + (col + k) * 7);
            masks[idx++] = mask;
        }
    }


    //diagonal masks '\'
    for (int col = 0; col < 4; ++col) {
        for (int row = 3; row < 6; ++row) {
            bitboard mask = 0;
            for (int k = 0; k < 4; ++k)
                mask |= 1ULL << (row - k + (col + k) * 7);
            masks[idx++] = mask;
        }
    }

    return masks;
}


//this function gets the score of the player/computer board
//the maximizing player is the computer
//this function should be called for both the computer and player boards
int get_score(bitboard bb, bitboard gameBoard, const MaskArray masks, bool isMaximizingPlayer) {
    int score = 0;

    int threeCount = count_open_cells(bb, gameBoard, masks, 3);
    int twoCount = count_open_cells(bb, gameBoard, masks, 2);

    //get relevant scoring heuristics
    int moveCount = __builtin_popcountll(gameBoard);
    heuristics h; 
    if (moveCount < 5+depth) {h = beginning;}
    else {h = midGame;}

    //if the scored is being evaluated for the computer
    if (isMaximizingPlayer) {
        score += threeCount * h.computer3InARowWeightage;
        score += twoCount * h.computer2InARowWeightage;

        //count pieces located in center column
        bitboard centerColumnMask = (1ULL << 21) | (1ULL << 22) | (1ULL << 23) | (1ULL << 24) | (1ULL << 25) | (1ULL << 26);
        int cellCount = __builtin_popcountll(bb & centerColumnMask);

        score += cellCount * h.centerColumnWeightage;
    }
    //if the scored is being evaluated for the player
    else {
        score += threeCount * h.player3InARowWeightage;
        score += twoCount * h.player2InARowWeightage;
    }

    return score;
}


