# Simple Two-Player Tic Tac Toe in Python

def print_board(board):
    print(f"\n {board[0]} | {board[1]} | {board[2]} ")
    print("-----------")
    print(f" {board[3]} | {board[4]} | {board[5]} ")
    print("-----------")
    print(f" {board[6]} | {board[7]} | {board[8]} \n")

def check_winner(board):
    # Winning combinations (rows, columns, diagonals)
    win_conditions = [
        (0, 1, 2), (3, 4, 5), (6, 7, 8), # Rows
        (0, 3, 6), (1, 4, 7), (2, 5, 8), # Cols
        (0, 4, 8), (2, 4, 6)             # Diagonals
    ]
    for a, b, c in win_conditions:
        if board[a] == board[b] == board[c] and board[a] != " ":
            return board[a]
    return None

def main():
    board = [" "] * 9
    current_player = "X"
    
    print("Welcome to Tic Tac Toe!")
    print("Positions are numbered 1-9 (Top-Left to Bottom-Right)")

    for turn in range(9):
        print_board(board)
        
        while True:
            try:
                move = int(input(f"Player {current_player}, enter move (1-9): ")) - 1
                if 0 <= move <= 8 and board[move] == " ":
                    board[move] = current_player
                    break
                else:
                    print("Invalid move. Square is occupied or out of range.")
            except ValueError:
                print("Please enter a number between 1 and 9.")

        winner = check_winner(board)
        if winner:
            print_board(board)
            print(f"Congratulations! Player {winner} wins!")
            return

        current_player = "O" if current_player == "X" else "X"

    print_board(board)
    print("It's a tie!")

if __name__ == "__main__":
    main()
