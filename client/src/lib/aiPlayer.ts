import { checkWinner, getAvailableMoves } from './gameLogic';

export function generateAIMove(board: (string | null)[]): number {
  const availableMoves = getAvailableMoves(board);
  
  if (availableMoves.length === 0) {
    return -1;
  }

  // Use minimax algorithm for AI decision making
  const bestMove = minimax(board, 0, false, -Infinity, Infinity);
  return bestMove.index;
}

interface MoveResult {
  index: number;
  score: number;
}

function minimax(
  board: (string | null)[], 
  depth: number, 
  isMaximizing: boolean, 
  alpha: number, 
  beta: number
): MoveResult {
  const winner = checkWinner(board);
  
  // Terminal states
  if (winner === 'O') return { index: -1, score: 10 - depth };
  if (winner === 'X') return { index: -1, score: depth - 10 };
  if (getAvailableMoves(board).length === 0) return { index: -1, score: 0 };

  const availableMoves = getAvailableMoves(board);
  const moves: MoveResult[] = [];

  for (const move of availableMoves) {
    const newBoard = [...board];
    newBoard[move] = isMaximizing ? 'O' : 'X';
    
    const result = minimax(newBoard, depth + 1, !isMaximizing, alpha, beta);
    moves.push({ index: move, score: result.score });
    
    if (isMaximizing) {
      alpha = Math.max(alpha, result.score);
    } else {
      beta = Math.min(beta, result.score);
    }
    
    // Alpha-beta pruning
    if (beta <= alpha) break;
  }

  // Return best move
  if (isMaximizing) {
    return moves.reduce((best, move) => move.score > best.score ? move : best);
  } else {
    return moves.reduce((best, move) => move.score < best.score ? move : best);
  }
}
