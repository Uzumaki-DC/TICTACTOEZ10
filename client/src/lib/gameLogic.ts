export function checkWinner(board: (string | null)[]): 'X' | 'O' | null {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a] as 'X' | 'O';
    }
  }
  return null;
}

export function isDraw(board: (string | null)[]): boolean {
  return board.every(cell => cell !== null) && !checkWinner(board);
}

export function getAvailableMoves(board: (string | null)[]): number[] {
  return board.map((cell, index) => cell === null ? index : -1).filter(index => index !== -1);
}

export function isValidMove(board: (string | null)[], position: number): boolean {
  return position >= 0 && position < 9 && board[position] === null;
}
