export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export const pieceColors = {
  I: '#38bdf8',
  J: '#60a5fa',
  L: '#f59e0b',
  O: '#facc15',
  S: '#34d399',
  T: '#c084fc',
  Z: '#fb7185',
};

export const pieces = {
  I: [[1, 1, 1, 1]],
  J: [[1, 0, 0], [1, 1, 1]],
  L: [[0, 0, 1], [1, 1, 1]],
  O: [[1, 1], [1, 1]],
  S: [[0, 1, 1], [1, 1, 0]],
  T: [[0, 1, 0], [1, 1, 1]],
  Z: [[1, 1, 0], [0, 1, 1]],
};

export const createBoard = () => Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));

export const createPiece = (type) => {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    color: pieceColors[type],
    shape: pieces[type].map(row => [...row]),
    x: Math.floor(BOARD_WIDTH / 2) - Math.ceil(pieces[type][0].length / 2),
    y: 0,
  };
};

export const clonePiece = (piece, overrides = {}) => ({
  ...piece,
  ...overrides,
  id: overrides.id || piece.id,
  type: overrides.type || piece.type,
  color: overrides.color || piece.color || pieceColors[overrides.type || piece.type],
  shape: (overrides.shape || piece.shape).map(row => [...row]),
});

export const createPieceBag = () => {
  const bag = Object.keys(pieces);
  for (let index = bag.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [bag[index], bag[swapIndex]] = [bag[swapIndex], bag[index]];
  }
  return bag;
};

export const randomPiece = () => {
  const types = Object.keys(pieces);
  const type = types[Math.floor(Math.random() * types.length)];
  return createPiece(type);
};

export const rotateShape = (shape) => {
  const rows = shape.length;
  const cols = shape[0].length;
  return Array.from({ length: cols }, (_, x) => Array.from({ length: rows }, (_, y) => shape[rows - 1 - y][x]));
};

export const rotateShapeCounter = (shape) => {
  const rows = shape.length;
  const cols = shape[0].length;
  return Array.from({ length: cols }, (_, x) => Array.from({ length: rows }, (_, y) => shape[y][cols - 1 - x]));
};

export const collides = (board, piece, offsetX = 0, offsetY = 0, shape = piece.shape) => {
  for (let y = 0; y < shape.length; y += 1) {
    for (let x = 0; x < shape[y].length; x += 1) {
      if (!shape[y][x]) continue;
      const boardX = piece.x + x + offsetX;
      const boardY = piece.y + y + offsetY;
      if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) return true;
      if (boardY >= 0 && board[boardY][boardX]) return true;
    }
  }
  return false;
};

export const mergePiece = (board, piece) => {
  const next = board.map(row => [...row]);
  piece.shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (!cell) return;
      const boardY = piece.y + y;
      const boardX = piece.x + x;
      if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
        next[boardY][boardX] = { type: piece.type, color: piece.color || pieceColors[piece.type] };
      }
    });
  });
  return next;
};

export const clearLines = (board) => {
  const remaining = board.filter(row => row.some(cell => !cell));
  const cleared = BOARD_HEIGHT - remaining.length;
  const emptyRows = Array.from({ length: cleared }, () => Array(BOARD_WIDTH).fill(null));
  return { board: [...emptyRows, ...remaining], cleared };
};

export const levelFromLines = (lines) => Math.min(15, Math.floor(lines / 6) + 1);

export const dropDelayForLevel = (level, reducedMotion = false, speedMultiplier = 1) => {
  if (reducedMotion) return 850;
  const baseDelay = 720;
  const gentleStep = 30;
  const minimumDelay = 170;
  return Math.max(minimumDelay, Math.round((baseDelay - (level - 1) * gentleStep) * speedMultiplier));
};

export const scoreForClear = (cleared, level, combo) => {
  if (!cleared) return 0;
  const base = [0, 100, 300, 500, 800][cleared] || 1000;
  const comboBonus = combo > 1 ? combo * 40 : 0;
  return (base + comboBonus) * level;
};

export const getGhostPiece = (board, piece) => {
  let ghost = { ...piece, shape: piece.shape.map(row => [...row]) };
  while (!collides(board, ghost, 0, 1)) {
    ghost = { ...ghost, y: ghost.y + 1 };
  }
  return ghost;
};

export const boardWithPiece = (board, piece, ghostPiece = null) => {
  const display = board.map(row => row.map(cell => {
    if (!cell) return null;
    return typeof cell === 'string'
      ? { type: cell, color: pieceColors[cell], ghost: false }
      : { ...cell, color: cell.color || pieceColors[cell.type], ghost: false };
  }));
  if (ghostPiece) {
    ghostPiece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (!cell) return;
        const boardY = ghostPiece.y + y;
        const boardX = ghostPiece.x + x;
        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH && !display[boardY][boardX]) {
          display[boardY][boardX] = { type: ghostPiece.type, color: ghostPiece.color || pieceColors[ghostPiece.type], ghost: true };
        }
      });
    });
  }
  piece.shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (!cell) return;
      const boardY = piece.y + y;
      const boardX = piece.x + x;
      if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
        display[boardY][boardX] = { type: piece.type, color: piece.color || pieceColors[piece.type], ghost: false };
      }
    });
  });
  return display;
};
