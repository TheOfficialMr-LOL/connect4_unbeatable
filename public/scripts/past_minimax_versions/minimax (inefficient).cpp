#include <iostream>
#include <string>
#include <vector>
#include <array>
#include <chrono> //for measuring execution time
#include <climits> //for INT_MAX and INT_MIN
#include <algorithm>
using namespace std;
using namespace std::chrono;


//function initializations
vector<vector<char>> convert_state_to_matrix(const string &state);
vector<int> dynamic_scoring(string state);

void display_board(const vector<vector<char>> &board);

bool check_state_validity(string &state);
bool check_winner(string &state);
bool check_window(const vector<char> window, char piece);

int get_score(string &state);
int evaluate_score_based_on_window(const vector<vector<int>> &window, const vector<vector<char>> &board, string &state);
int minimax(string &state, int depth, int alpha, int beta, bool maximizingPlayer);
int get_best_column(string state, int depth);






//entry point of the program
int main() {
	//start measuring time
	auto startTime = high_resolution_clock::now();

	string state = "0123212"; //initial state of the game
	int depth = 3; //depth of the minimax algorithm
	cout << "Initial state: " << state << endl;
	int bestColumn = get_best_column(state, depth); //get the best column to play

	cout << "Best column to play: " << bestColumn << endl;

	auto stopTime = high_resolution_clock::now();
	auto duration = duration_cast<milliseconds>(stopTime - startTime);
	cout << "Program execution time: " << duration.count() << " milliseconds" << endl;

	return 0;
}




int get_best_column(string state, int depth) {

	vector<int> queue = {}; 
	for (int column = 0; column < 7; column++) {
		string newState = state + to_string(column);
		queue.push_back(minimax(newState, depth, INT_MIN, INT_MAX, false)); //minimax function call
	}

	//display the queue
	cout << "Queue: ";
	for (int i = 0; i < queue.size(); i++) {
		cout << queue[i] << " ";
	}
	cout << endl;


	//filter queue to remove +inf and -inf values
    //+inf == invalid moves
    // -inf == invalid moves
	for (int i = 0; i < queue.size(); i++) {
		if (queue[i] == INT_MAX) {queue[i] = INT_MIN;} //replace +inf with -inf
	}

	//return the index of the maximum element in the queue
	return distance(queue.begin(), max_element(queue.begin(), queue.end())); 

}







int minimax(string &state, int depth, int alpha, int beta, bool maximizingPlayer) {

	//check if the current state is a terminal state

	if (depth == 0 || check_winner(state)) {
		return get_score(state); //return the score of the current state
	}


	
	if (maximizingPlayer) {	
		//maximizing player is the computer
		int maxEval = INT_MIN;
	
		for (int column = 0; column < 7; column++) {
			string newState = state + to_string(column); 

			//check if the new state is valid
			if (check_state_validity(newState)) {

				int eval = minimax(newState, depth - 1, alpha, beta, false); 
				maxEval = max(maxEval, eval); //update maximum evaluation
				alpha = max(alpha, eval); //update alpha value
				if (beta <= alpha) {
					break; //beta cut-off (alpha-beta pruning)
				}
			}
		}

		return maxEval; //return the maximum evaluation
	}
	else {

		//minimizing player is the player
		int minEval = INT_MAX;

		for (int column = 0; column < 7; column++) {
			string newState =  state + to_string(column);

			//check if the new state is valid
			if (check_state_validity(newState)) {
				
				int eval = minimax(newState, depth - 1, alpha, beta, true); 
				minEval = min(minEval, eval); //update minimum evaluation
				beta = min(beta, eval); //update beta value
				if (beta <= alpha) {
					break; //alpha cut-off (alpha-beta pruning)
				}

			}
		}
		return minEval; //return the minimum evaluation
	}
}















//function to convert a state, like '01023', to a 6x7 matrix
//the state is a string of digits, where each digit represents a column in the Connect 4 game
vector<vector<char>> convert_state_to_matrix(const string &state) {

	//create empty 2d array of size 6x7 with all elements initialized to '0'
	vector<vector<char>> board(6, vector<char>(7, '0'));

	//we will assume that it is the computer's turn when turn is divisible by 2
	int turn=0;

	for (char i : state) {
		int column= i - '0'; //convert char to int

		//checking if column is full
		for (int row = 5; row>=0; row--) {
			if (board[row][column] == '0') {
				if (turn % 2 != 0) {board[row][column] = 'o';}
				else {board[row][column] = 'x';}
				turn++;
				break;
			}
		}
	}

    return board;
}




//function to display the board
void display_board(const vector<vector<char>> &board) {
	for (int row = 0; row < 6; row++) {
		for (int column = 0; column < 7; column++) {
			cout << board[row][column] << " ";
		}
		//new line after each row
		cout << endl;
	}
}




//this function checks if there are any illegal moves in the current state i.e. if there are any columns that are full
bool check_state_validity(string &state) {
    //frequency of column selection will be counted, and if it exceeds 6, then the state is invalid
	for (int column = 0; column < 7; column++) {
		int frequency = 0;

		//loop through the state and count the frequency of the column
		for (char target : state) {
			if (target - '0' == column) {
				frequency++;
			}
		}
		//if frequency exceeds 6, then the state is invalid
		if (frequency > 6) {return false; }
	}

	//if all columns have frequency less than or equal to 6, then the state is valid
	return true; 
}







//this function checks if there is a winner in the current state
// it will be used to check if the game is over to ensure no illegal moves are made
bool check_winner(string &state) {
	
	vector<vector<char>> board = convert_state_to_matrix(state);

	//initialize variables
	int turn;
	char piece;
	int columnOriginal;
	int rowOriginal;
	int column;
	int row;

	vector<char> window;

	//determine whether the last move made was by the computer or the player
    //if the length of the state is even, then it is the computer's turn and vice-versa

	turn = state.length() % 2; //0 for player, 1 for computer

	if (turn != 0) {piece = 'x';}
	else {piece = 'o';}

	columnOriginal = state.back() - '0'; //get the last column played


	//find the row of the last move made
	rowOriginal = -1;
	for (int row = 0; row < 6; row++) {
		if (board[row][columnOriginal] != '0') {
			rowOriginal = row;
			break;
		}
	}



	//horizontal window
	row = rowOriginal;
	for (int columnIncrement = -3; columnIncrement <= 3; columnIncrement++) {
		column = columnOriginal + columnIncrement;
		if (column >= 0 && column < 7) {
			window.push_back(board[row][column]);
		}
	}
	//check for winner
	if (check_window(window, piece)) {return true;} //winner found

	window.clear();



	//vertical window
	column = columnOriginal;
	for (int rowIncrement = -3; rowIncrement <= 3; rowIncrement++) {
		row = rowOriginal + rowIncrement;
		if (row >= 0 && row < 6) {
			window.push_back(board[row][column]);
		}
	}
	//check for winner
	if (check_window(window, piece)) {return true;} //winner found

	window.clear();



	//diagnol window top to bottom
	for (int increment = -3; increment <= 3; increment++) {
		row = rowOriginal + increment;
		column = columnOriginal + increment;
		if (row >= 0 && row < 6 && column >= 0 && column < 7) {
			window.push_back(board[row][column]);
		}
	}
	//check for winner
	if (check_window(window, piece)) {return true;} //winner found

	window.clear();




	//diagnol window bottom to top
	for (int increment = -3; increment <= 3; increment++) {
		row = rowOriginal - increment;
		column = columnOriginal + increment;
		if (row >= 0 && row < 6 && column >= 0 && column < 7) {
			window.push_back(board[row][column]);
		}
	}
	//check for winner
	if (check_window(window, piece)) {return true;} //winner found

	//if no winner found, return false
	return false;
}



bool check_window(const vector<char> window, char piece) {
	int count = 0;
	for (char cell : window) {
		if (cell == piece) {
			count++;
			if (count == 4) {
				return true; //winner found
			}
		}
		else {count = 0;}
	}
	return false; //no winner found
}






/*
This function calculates the score of the last move made in the game.
It checks the last move made and generates a scoring list in all four directions:
1. Horizontal
2. Vertical
3. Diagonal (both directions)
It then calculates the score based on the number of consecutive pieces in each direction.
*/

int get_score(string &state) {
	vector<vector<char>> board = convert_state_to_matrix(state);
	int finalScore = 0;


	//generating the scoring list in each direction
	

	//horizontal windows
	for (int column = 0; column < (7-3); column++) {
		for (int row = 0; row < 6; row++) {

			//generating 4-cell scoring window
			vector<vector<int>> window = {
				{row, column},
				{row, column+1},
				{row, column+2},
				{row, column+3}	
			};
			//evaluate the score of the window
			finalScore += evaluate_score_based_on_window(window, board, state);
		}
	}



	//vertical windows
	for (int column = 0; column < 7; column++) {
		for (int row = 0; row < (6-3); row++) {

			//generating 4-cell scoring window
			vector<vector<int>> window = {
				{row, column},
				{row+1, column},
				{row+2, column},
				{row+3, column}	
			};
			//evaluate the score of the window
			finalScore += evaluate_score_based_on_window(window, board, state);
		}
	}



	//diagonal windows (top-left to bottom-right)
	for (int column = 0; column < (7-3); column++) {
		for (int row = 3; row < 6; row++) {

			//generating 4-cell scoring window
			vector<vector<int>> window = {
				{row, column},
				{row-1, column+1},
				{row-2, column+2},
				{row-3, column+3}	
			};
			//evaluate the score of the window
			finalScore += evaluate_score_based_on_window(window, board, state);
		}
	}



	//diagonal windows (bottom-left to top-right)
	for (int column = 0; column < (7-3); column++) {
		for (int row = 0; row < (6-3); row++) {

			//generating 4-cell scoring window
			vector<vector<int>> window = {
				{row, column},
				{row+1, column+1},
				{row+2, column+2},
				{row+3, column+3}	
			};
			//evaluate the score of the window
			finalScore += evaluate_score_based_on_window(window, board, state);
		}
	}


	//count cells in the center column
	int centerColumnCount = 0;
	for (int row = 0; row < 6; row++) {
		if (board[row][3] == 'x') {centerColumnCount++;}
	}


	//applying center column weightage
	int centerColumnWeightage = dynamic_scoring(state)[0]; 
	finalScore += centerColumnCount * centerColumnWeightage;

	//return final score
	return finalScore;
}




int evaluate_score_based_on_window(const vector<vector<int>> &window, const vector<vector<char>> &board, string &state) {

	//retrieve the scoring weights based on the state length
	vector<int> scoringHeuristics = dynamic_scoring(state);
	int xWinWeightage=scoringHeuristics[1];
    int x3InARowWeightage=scoringHeuristics[2];
    int x2InARowWeightage=scoringHeuristics[3];

    int oWinWeightage=scoringHeuristics[4];
    int o3InARowWeightage=scoringHeuristics[5];
    int o2InARowWeightage=scoringHeuristics[6];


	int score = 0;

	//check if window is filled with '0's, and if it is, return 0
	int zeroCount = 0;
	for (auto &cell : window) {
		int row = cell[0];
		int column = cell[1];
		if (board[row][column] == '0') {
			zeroCount++;
		}
	}
	if (zeroCount == 4) {return 0;} //no score for empty window



	//tabulating the number of 'x' and 'o' in the current window
	int xCount = 0;
	int oCount = 0;

	//looping through each cell in the window
	for (auto &cell : window) {
		int row = cell[0];
		int column = cell[1];

		if (board[row][column] == 'x') {xCount++;} 
		else if (board[row][column] == 'o') {oCount++;}
	}


	//applying scoring heuristics 

	//checking if the current window is 'pure' -- this means that it only has one type of piece and the rest are empty
	if (xCount == 0 || oCount == 0) {
		//pure window
        //begin applying scoring heuristics
        
        if (xCount == 4) {score += xWinWeightage;} //4 in a row for the computer
        else if (oCount == 4) {score += oWinWeightage;} //4 in a row for the player
        else if (xCount == 3) {score += x3InARowWeightage;} //3 in a row for the computer
        else if (oCount == 3) {score += o3InARowWeightage;} //3 in a row for the player
        else if (xCount == 2) {score += x2InARowWeightage;} //2 in a row for the computer
        else if (oCount == 2) {score += o2InARowWeightage;} //2 in a row for the player
	}

	return score;

}








vector<int> dynamic_scoring(string state) {
	
	int centerColumnWeightage;
    int computerWinWeightage;
    int computer3InARowWeightage;
    int computer2InARowWeightage;
    int playerWinWeightage;
    int player3InARowWeightage;
    int player2InARowWeightage;

	if (state.length() <= 5) {
		centerColumnWeightage = 100;

        computerWinWeightage = 1000000;
        computer3InARowWeightage = 100;
        computer2InARowWeightage = 10;

        playerWinWeightage = -2000000;
        player3InARowWeightage = -300;
        player2InARowWeightage = -3;
	}

	else {

		centerColumnWeightage = 10;

        computerWinWeightage = 1000000;
        computer3InARowWeightage = 100;
        computer2InARowWeightage = 50;

        playerWinWeightage = -2000000;
        player3InARowWeightage = -200;
        player2InARowWeightage = -20;
	}

	vector<int> result =  {
		centerColumnWeightage,
		computerWinWeightage,
		computer3InARowWeightage,
		computer2InARowWeightage,
		playerWinWeightage,
		player3InARowWeightage,
		player2InARowWeightage
	};

	return result;
}