import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Gamepad2,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCw,
  RotateCcw,
  SkipForward,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  boardWithPiece,
  clearLines,
  clonePiece,
  collides,
  createBoard,
  createPiece,
  createPieceBag,
  dropDelayForLevel,
  getGhostPiece,
  levelFromLines,
  mergePiece,
  randomPiece,
  rotateShape,
  rotateShapeCounter,
  scoreForClear,
} from './gameEngine';
import { achievementCatalog, loadFocusStats, saveFocusStats, updateStatsAfterGame } from './focusStats';

const skinOptions = [
  { id: 'taskray', label: 'TaskRay Blue', board: '#070b1d' },
  { id: 'classic', label: 'Classic', board: '#0f172a' },
  { id: 'pastel', label: 'Pastel', board: '#18162a' },
  { id: 'neon', label: 'Neon', board: '#070014' },
  { id: 'nature', label: 'Nature', board: '#071a14' },
  { id: 'galaxy', label: 'Galaxy', board: '#090821' },
];

const difficultyOptions = [
  { id: 'chill', label: 'Chill', startLevel: 1, scoreStep: 4200, speedMultiplier: 1.16, description: 'Relaxed pace with very gradual speed-ups.' },
  { id: 'classic', label: 'Classic', startLevel: 1, scoreStep: 3000, speedMultiplier: 1, description: 'Balanced pace that speeds up little by little.' },
  { id: 'expert', label: 'Expert', startLevel: 3, scoreStep: 2400, speedMultiplier: 0.9, description: 'More pressure, but still ramps smoothly.' },
];

const findDifficulty = (id) => difficultyOptions.find(option => option.id === id) || difficultyOptions[1];

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const defaultKeyBindings = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  softDrop: 'ArrowDown',
  rotateClockwise: 'ArrowUp',
  rotateCounter: 'z',
  hardDrop: ' ',
  hold: 'c',
  pause: 'p',
  restart: 'r',
};

const normalizeKey = (key) => {
  if (key === 'Spacebar') return ' ';
  return key.length === 1 ? key.toLowerCase() : key;
};

const loadKeyBindings = (userId) => {
  try {
    const saved = localStorage.getItem(`taskray-focus-keys-${userId}`);
    return saved ? { ...defaultKeyBindings, ...JSON.parse(saved) } : defaultKeyBindings;
  } catch {
    return defaultKeyBindings;
  }
};

const keyBindingLabels = {
  left: 'Move Left',
  right: 'Move Right',
  softDrop: 'Soft Drop',
  rotateClockwise: 'Rotate CW',
  rotateCounter: 'Rotate CCW',
  hardDrop: 'Hard Drop',
  hold: 'Hold',
  pause: 'Pause',
  restart: 'Restart',
};

const displayKey = (key) => {
  if (key === ' ') return 'Space';
  if (key === 'Escape') return 'Esc';
  return key.replace('Arrow', '');
};

const LOCK_DELAY_MS = 480;

function FocusBreak({ currentUser, tasks = [] }) {
  const taskSummary = useMemo(() => {
    const today = todayKey();
    const dueToday = tasks.filter(task => (task.dueDate || '').slice(0, 10) === today);
    const completedToday = tasks.filter(task => {
      const completed = task.status === 'completed';
      const updatedToday = (task.updated_at || task.updatedAt || task.completedAt || '').slice(0, 10) === today;
      return completed && (updatedToday || (task.dueDate || '').slice(0, 10) === today);
    });
    return {
      totalToday: dueToday.length,
      completedToday: completedToday.length,
      unlockedMinutes: Math.min(30, completedToday.length * 10),
      allTodayDone: dueToday.length > 0 && dueToday.every(task => task.status === 'completed'),
    };
  }, [tasks]);

  const [board, setBoard] = useState(() => createBoard());
  const [piece, setPiece] = useState(() => randomPiece());
  const [nextPiece, setNextPiece] = useState(() => randomPiece());
  const [heldPiece, setHeldPiece] = useState(null);
  const [canHold, setCanHold] = useState(true);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [combo, setCombo] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [skin, setSkin] = useState(() => localStorage.getItem('taskray-focus-skin') || 'taskray');
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem('taskray-focus-sound') !== 'off');
  const [reducedMotion, setReducedMotion] = useState(() => localStorage.getItem('taskray-focus-motion') === 'reduced');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('taskray-focus-contrast') === 'high');
  const [stats, setStats] = useState(() => loadFocusStats(currentUser.id));
  const [keyBindings, setKeyBindings] = useState(() => loadKeyBindings(currentUser.id));
  const [bindingToEdit, setBindingToEdit] = useState(null);
  const [difficultyId, setDifficultyId] = useState(() => localStorage.getItem('taskray-focus-difficulty') || 'classic');
  const [restartPromptOpen, setRestartPromptOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const boardFullscreenRef = useRef(null);
  const gameSavedRef = useRef(false);
  const gravityRef = useRef({ lastTime: 0, accumulator: 0 });
  const lockDelayRef = useRef(null);
  const boardRef = useRef(board);
  const pieceRef = useRef(piece);
  const nextPieceRef = useRef(nextPiece);
  const heldPieceRef = useRef(heldPiece);
  const canHoldRef = useRef(canHold);
  const lockPieceRef = useRef(null);
  const moveRef = useRef(null);
  const pieceBagRef = useRef(createPieceBag());
  const keyStateRef = useRef({
    left: false,
    right: false,
    down: false,
    horizontal: null,
    horizontalStarted: 0,
    lastHorizontalMove: 0,
    lastSoftDrop: 0,
  });

  const difficulty = findDifficulty(difficultyId);
  const speed = dropDelayForLevel(level, reducedMotion, difficulty.speedMultiplier);
  const activeSkin = skinOptions.find(item => item.id === skin) || skinOptions[0];
  const displayBoard = useMemo(() => boardWithPiece(board, piece, getGhostPiece(board, piece)), [board, piece]);

  const toggleFullscreen = useCallback(async () => {
    const node = boardFullscreenRef.current;
    if (!node || !document.fullscreenEnabled) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await node.requestFullscreen();
      }
    } catch {
      // Browser fullscreen can be blocked outside direct user gestures.
    }
  }, []);

  const pullPiece = useCallback(() => {
    if (pieceBagRef.current.length === 0) pieceBagRef.current = createPieceBag();
    const type = pieceBagRef.current.shift();
    return createPiece(type);
  }, []);

  useEffect(() => {
    boardRef.current = board;
    pieceRef.current = piece;
    nextPieceRef.current = nextPiece;
    heldPieceRef.current = heldPiece;
    canHoldRef.current = canHold;
  }, [board, canHold, heldPiece, nextPiece, piece]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setFullscreen(document.fullscreenElement === boardFullscreenRef.current);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const clearLockDelay = useCallback(() => {
    if (!lockDelayRef.current) return;
    window.clearTimeout(lockDelayRef.current);
    lockDelayRef.current = null;
  }, []);

  useEffect(() => clearLockDelay, [clearLockDelay]);

  const finishGame = useCallback((finalScore = score, finalLines = lines, finalLevel = level, finalElapsed = elapsedSeconds) => {
    if (gameSavedRef.current) return;
    gameSavedRef.current = true;
    const nextStats = updateStatsAfterGame(stats, {
      score: finalScore,
      lines: finalLines,
      level: finalLevel,
      elapsedSeconds: finalElapsed,
    }, taskSummary);
    setStats(nextStats);
    saveFocusStats(currentUser.id, nextStats);
  }, [currentUser.id, elapsedSeconds, level, lines, score, stats, taskSummary]);

  const saveCurrentRound = useCallback(() => {
    if (gameSavedRef.current || (!score && !lines && !elapsedSeconds)) return;
    finishGame(score, lines, level, elapsedSeconds);
  }, [elapsedSeconds, finishGame, level, lines, score]);

  const resetGame = useCallback((start = true) => {
    clearLockDelay();
    const freshBoard = createBoard();
    pieceBagRef.current = createPieceBag();
    const firstPiece = pullPiece();
    const secondPiece = pullPiece();
    boardRef.current = freshBoard;
    pieceRef.current = firstPiece;
    nextPieceRef.current = secondPiece;
    heldPieceRef.current = null;
    canHoldRef.current = true;
    keyStateRef.current = {
      left: false,
      right: false,
      down: false,
      horizontal: null,
      horizontalStarted: 0,
      lastHorizontalMove: 0,
      lastSoftDrop: 0,
    };
    setBoard(freshBoard);
    setPiece(firstPiece);
    setNextPiece(secondPiece);
    setHeldPiece(null);
    setCanHold(true);
    setScore(0);
    setLines(0);
    setLevel(difficulty.startLevel);
    setCombo(0);
    setElapsedSeconds(0);
    setGameOver(false);
    setPaused(false);
    setRunning(start);
    gameSavedRef.current = false;
  }, [clearLockDelay, difficulty.startLevel, pullPiece]);

  const startGame = useCallback(() => {
    resetGame(true);
  }, [resetGame]);

  const confirmRestart = useCallback(() => {
    if (!running && !gameOver && score === 0 && elapsedSeconds === 0) {
      resetGame(true);
      return;
    }
    setRestartPromptOpen(true);
  }, [elapsedSeconds, gameOver, resetGame, running, score]);

  const lockPiece = useCallback((settledPiece, placementBonus = 0) => {
    clearLockDelay();
    const merged = mergePiece(boardRef.current, settledPiece);
    const result = clearLines(merged);
    const newLines = lines + result.cleared;
    const baseScore = score + placementBonus;
    const scoreLevel = difficulty.startLevel + Math.floor(baseScore / difficulty.scoreStep);
    const lineLevel = Math.max(levelFromLines(newLines), scoreLevel, difficulty.startLevel);
    const newCombo = result.cleared ? combo + 1 : 0;
    const lineScore = scoreForClear(result.cleared, lineLevel, newCombo);
    const provisionalScore = baseScore + lineScore;
    const newLevel = Math.max(lineLevel, difficulty.startLevel + Math.floor(provisionalScore / difficulty.scoreStep));
    const levelBonus = newLevel > level ? newLevel * 75 : 0;
    const newScore = provisionalScore + levelBonus;
    const spawned = clonePiece(nextPieceRef.current, { x: 3, y: 0 });
    const upcoming = pullPiece();

    if (collides(result.board, spawned)) {
      boardRef.current = result.board;
      setBoard(result.board);
      canHoldRef.current = false;
      setScore(newScore);
      setLines(newLines);
      setLevel(newLevel);
      setCombo(newCombo);
      setRunning(false);
      setGameOver(true);
      finishGame(newScore, newLines, newLevel, elapsedSeconds);
      return;
    }

    boardRef.current = result.board;
    setBoard(result.board);
    pieceRef.current = spawned;
    nextPieceRef.current = upcoming;
    canHoldRef.current = true;
    setPiece(spawned);
    setNextPiece(upcoming);
    setCanHold(true);
    setScore(newScore);
    setLines(newLines);
    setLevel(newLevel);
    setCombo(newCombo);
  }, [clearLockDelay, combo, difficulty.scoreStep, difficulty.startLevel, elapsedSeconds, finishGame, level, lines, pullPiece, score]);

  useEffect(() => {
    lockPieceRef.current = lockPiece;
  }, [lockPiece]);

  const scheduleLockDelay = useCallback(() => {
    if (lockDelayRef.current || !running || paused || gameOver) return;
    lockDelayRef.current = window.setTimeout(() => {
      lockDelayRef.current = null;
      const currentBoard = boardRef.current;
      const currentPiece = pieceRef.current;
      if (running && !paused && !gameOver && collides(currentBoard, currentPiece, 0, 1)) {
        lockPieceRef.current?.(currentPiece);
      }
    }, LOCK_DELAY_MS);
  }, [gameOver, paused, running]);

  const resetGroundLockDelay = useCallback((nextPieceState) => {
    clearLockDelay();
    if (collides(boardRef.current, nextPieceState, 0, 1)) scheduleLockDelay();
  }, [clearLockDelay, scheduleLockDelay]);

  const move = useCallback((dx, dy, awardDropPoint = false) => {
    if (!running || paused || gameOver) return false;
    const currentBoard = boardRef.current;
    const currentPiece = pieceRef.current;
    if (!collides(currentBoard, currentPiece, dx, dy)) {
      const movedPiece = clonePiece(currentPiece, { x: currentPiece.x + dx, y: currentPiece.y + dy });
      pieceRef.current = movedPiece;
      setPiece(movedPiece);
      if (dy > 0 && awardDropPoint) setScore(prev => prev + 1);
      if (dy > 0) clearLockDelay();
      else resetGroundLockDelay(movedPiece);
      return true;
    }
    if (dy > 0) scheduleLockDelay();
    return false;
  }, [clearLockDelay, gameOver, paused, resetGroundLockDelay, running, scheduleLockDelay]);

  useEffect(() => {
    moveRef.current = move;
  }, [move]);

  const rotate = useCallback((direction = 1) => {
    const currentBoard = boardRef.current;
    const currentPiece = pieceRef.current;
    if (!running || paused || gameOver || currentPiece.type === 'O') return;
    const rotated = direction === -1 ? rotateShapeCounter(currentPiece.shape) : rotateShape(currentPiece.shape);
    const kicks = [0, -1, 1, -2, 2];
    const kick = kicks.find(offset => !collides(currentBoard, currentPiece, offset, 0, rotated));
    if (kick !== undefined) {
      const rotatedPiece = clonePiece(currentPiece, { x: currentPiece.x + kick, shape: rotated });
      pieceRef.current = rotatedPiece;
      setPiece(rotatedPiece);
      resetGroundLockDelay(rotatedPiece);
    }
  }, [gameOver, paused, resetGroundLockDelay, running]);

  const hardDrop = useCallback(() => {
    if (!running || paused || gameOver) return;
    clearLockDelay();
    const currentBoard = boardRef.current;
    let dropped = clonePiece(pieceRef.current);
    let distance = 0;
    while (!collides(currentBoard, dropped, 0, 1)) {
      dropped = clonePiece(dropped, { y: dropped.y + 1 });
      distance += 1;
    }
    lockPiece(dropped, distance * 2);
  }, [clearLockDelay, gameOver, lockPiece, paused, running]);

  const holdPiece = useCallback(() => {
    const currentPiece = pieceRef.current;
    const currentNextPiece = nextPieceRef.current;
    const currentHeldPiece = heldPieceRef.current;
    if (!running || paused || gameOver || !canHoldRef.current) return;
    clearLockDelay();

    const resetCurrent = clonePiece(currentPiece, {
      x: Math.floor(10 / 2) - Math.ceil(currentPiece.shape[0].length / 2),
      y: 0,
    });

    if (!currentHeldPiece) {
      const spawned = clonePiece(currentNextPiece, { x: 3, y: 0 });
      if (collides(boardRef.current, spawned)) {
        setGameOver(true);
        setRunning(false);
        return;
      }
      setHeldPiece(resetCurrent);
      heldPieceRef.current = resetCurrent;
      pieceRef.current = spawned;
      setPiece(spawned);
      const upcoming = pullPiece();
      nextPieceRef.current = upcoming;
      setNextPiece(upcoming);
    } else {
      const swapPiece = clonePiece(currentHeldPiece, {
        x: Math.floor(10 / 2) - Math.ceil(currentHeldPiece.shape[0].length / 2),
        y: 0,
      });
      if (collides(boardRef.current, swapPiece)) return;
      setHeldPiece(resetCurrent);
      heldPieceRef.current = resetCurrent;
      pieceRef.current = swapPiece;
      setPiece(swapPiece);
    }

    canHoldRef.current = false;
    setCanHold(false);
  }, [clearLockDelay, gameOver, paused, pullPiece, running]);

  useEffect(() => {
    if (!running || paused || gameOver) return undefined;
    gravityRef.current = { lastTime: performance.now(), accumulator: Math.max(0, speed - 240) };
    let frameId;
    const tick = (time) => {
      const elapsed = time - gravityRef.current.lastTime;
      gravityRef.current.lastTime = time;
      gravityRef.current.accumulator += elapsed;

      while (gravityRef.current.accumulator >= speed) {
        moveRef.current?.(0, 1, false);
        gravityRef.current.accumulator -= speed;
      }

      frameId = window.requestAnimationFrame(tick);
    };
    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [gameOver, paused, running, speed]);

  useEffect(() => {
    if (!running || paused || gameOver) return undefined;
    const timer = window.setInterval(() => setElapsedSeconds(seconds => seconds + 1), 1000);
    return () => window.clearInterval(timer);
  }, [gameOver, paused, running]);

  useEffect(() => {
    const controlledKeys = new Set(Object.values(keyBindings).concat('Escape'));
    const onKeyDown = (event) => {
      const key = normalizeKey(event.key);
      if (bindingToEdit) {
        event.preventDefault();
        setKeyBindings(prev => ({ ...prev, [bindingToEdit]: key }));
        setBindingToEdit(null);
        return;
      }
      if (controlledKeys.has(key)) event.preventDefault();

      const state = keyStateRef.current;
      const now = performance.now();

      if (key === keyBindings.left && !state.left) {
        state.left = true;
        state.horizontal = 'left';
        state.horizontalStarted = now;
        state.lastHorizontalMove = now;
        move(-1, 0);
        return;
      }

      if (key === keyBindings.right && !state.right) {
        state.right = true;
        state.horizontal = 'right';
        state.horizontalStarted = now;
        state.lastHorizontalMove = now;
        move(1, 0);
        return;
      }

      if (key === keyBindings.softDrop && !state.down) {
        state.down = true;
        state.lastSoftDrop = now;
        move(0, 1, false);
        return;
      }

      if (event.repeat) return;
      if (key === keyBindings.rotateClockwise) rotate(1);
      if (key === keyBindings.rotateCounter) rotate(-1);
      if (key === keyBindings.hardDrop) hardDrop();
      if (key === keyBindings.hold) holdPiece();
      if (key === keyBindings.pause || key === 'Escape') setPaused(value => running && !gameOver ? !value : value);
      if (key === keyBindings.restart) confirmRestart();
    };

    const onKeyUp = (event) => {
      const key = normalizeKey(event.key);
      const state = keyStateRef.current;
      if (key === keyBindings.left) state.left = false;
      if (key === keyBindings.right) state.right = false;
      if (key === keyBindings.softDrop) state.down = false;
      if (state.left && !state.right) state.horizontal = 'left';
      else if (state.right && !state.left) state.horizontal = 'right';
      else state.horizontal = null;
      state.horizontalStarted = performance.now();
      state.lastHorizontalMove = performance.now();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [bindingToEdit, confirmRestart, gameOver, hardDrop, holdPiece, keyBindings, move, rotate, running]);

  useEffect(() => {
    if (!running || paused || gameOver) return undefined;
    let frameId;
    const dasDelay = 145;
    const arrDelay = 55;
    const softDropDelay = 45;
    const tick = (time) => {
      const state = keyStateRef.current;
      const horizontalConflict = state.left && state.right;
      if (!horizontalConflict && state.horizontal) {
        const dx = state.horizontal === 'left' ? -1 : 1;
        const pastDelay = time - state.horizontalStarted >= dasDelay;
        const repeatReady = time - state.lastHorizontalMove >= arrDelay;
        if (pastDelay && repeatReady) {
          move(dx, 0);
          state.lastHorizontalMove = time;
        }
      }
      if (state.down && time - state.lastSoftDrop >= softDropDelay) {
        move(0, 1, false);
        state.lastSoftDrop = time;
      }
      frameId = window.requestAnimationFrame(tick);
    };
    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [gameOver, move, paused, running]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && running && !gameOver) setPaused(true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [gameOver, running]);

  useEffect(() => {
    localStorage.setItem('taskray-focus-skin', skin);
    localStorage.setItem('taskray-focus-sound', soundOn ? 'on' : 'off');
    localStorage.setItem('taskray-focus-motion', reducedMotion ? 'reduced' : 'standard');
    localStorage.setItem('taskray-focus-contrast', highContrast ? 'high' : 'standard');
    localStorage.setItem('taskray-focus-difficulty', difficultyId);
  }, [difficultyId, highContrast, reducedMotion, skin, soundOn]);

  useEffect(() => {
    localStorage.setItem(`taskray-focus-keys-${currentUser.id}`, JSON.stringify(keyBindings));
  }, [currentUser.id, keyBindings]);

  useEffect(() => {
    if (gameOver) finishGame();
  }, [finishGame, gameOver]);

  const averageScore = stats.gamesPlayed ? Math.round(stats.totalScore / stats.gamesPlayed) : 0;
  const unlockedAchievements = new Set(stats.achievements || []);

  return (
    <section
      className={`focus-break-layout skin-${activeSkin.id}${highContrast ? ' high-contrast' : ''}`}
      style={{ '--focus-board-bg': activeSkin.board }}
    >
      <article className="focus-hero">
        <div>
          <span className="metric-label">TaskTris</span>
          <h2>Short falling-block break after study work.</h2>
          <p>Clear rows, build combos, and keep the break lightweight. The game pauses automatically when the tab is hidden.</p>
        </div>
        <div className="focus-unlock-card">
          <strong>{taskSummary.unlockedMinutes || 0} min</strong>
          <span>{taskSummary.completedToday} completed today</span>
          <small>{taskSummary.allTodayDone ? 'Perfect focus unlocked' : 'Complete tasks to earn bonus break time'}</small>
        </div>
      </article>

      <div className="focus-game-shell">
        <div
          ref={boardFullscreenRef}
          className={`focus-board-wrap${fullscreen ? ' is-fullscreen' : ''}`}
        >
          <div className="focus-board" role="application" aria-label="TaskTris falling block game board">
            {displayBoard.map((row, y) => row.map((cell, x) => (
              <span
                key={`${y}-${x}`}
                className={`focus-cell${cell ? ' filled' : ''}${cell?.ghost ? ' ghost' : ''}`}
                style={cell ? { '--cell-color': cell.color } : undefined}
              />
            )))}
            {!running && !gameOver && (
              <div className="focus-board-overlay">
                <Gamepad2 size={34} />
                <strong>Ready for a quick break?</strong>
                <p>Choose a difficulty before starting. {difficulty.label} mode starts at level {difficulty.startLevel}.</p>
                <p className="focus-best-note">Saved high score: {stats.highestScore.toLocaleString()}</p>
                <div className="focus-start-difficulty" aria-label="Choose TaskTris difficulty before starting">
                  {difficultyOptions.map(option => (
                    <button
                      type="button"
                      key={option.id}
                      className={difficultyId === option.id ? 'active' : ''}
                      onClick={() => {
                        setDifficultyId(option.id);
                        setLevel(option.startLevel);
                      }}
                    >
                      <strong>{option.label}</strong>
                      <span>{option.description}</span>
                    </button>
                  ))}
                </div>
                <div className="focus-start-actions">
                  <button className="dash-submit-btn" type="button" onClick={startGame}><Play size={15} /> Start Game</button>
                  <button className="dash-cancel-btn" type="button" onClick={toggleFullscreen}>
                    {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />} {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  </button>
                </div>
              </div>
            )}
            {paused && !gameOver && (
              <div className="focus-board-overlay">
                <Pause size={34} />
                <strong>Paused</strong>
                <button className="dash-submit-btn" type="button" onClick={() => setPaused(false)}><Play size={15} /> Resume</button>
              </div>
            )}
            {gameOver && (
              <div className="focus-board-overlay">
                <Trophy size={34} />
                <strong>Game Over</strong>
                <p>{score.toLocaleString()} points</p>
                <button className="dash-submit-btn" type="button" onClick={confirmRestart}><RotateCcw size={15} /> Restart</button>
              </div>
            )}
          </div>
          <div className="focus-touch-controls" aria-label="Touch controls">
            <button type="button" onClick={() => move(-1, 0)}>Left</button>
            <button type="button" onClick={() => rotate(1)}><RotateCw size={16} /> CW</button>
            <button type="button" onClick={() => rotate(-1)}><RotateCcw size={16} /> CCW</button>
            <button type="button" onClick={() => move(1, 0)}>Right</button>
            <button type="button" onClick={() => move(0, 1, false)}>Soft</button>
            <button type="button" onClick={hardDrop}><SkipForward size={16} /> Hard</button>
            <button type="button" onClick={holdPiece} disabled={!canHold}>Hold</button>
            <button type="button" onClick={() => setPaused(value => running && !gameOver ? !value : value)}>{paused ? 'Resume' : 'Pause'}</button>
          </div>
          {fullscreen && (
            <button className="focus-fullscreen-exit" type="button" onClick={toggleFullscreen}>
              <Minimize2 size={15} /> Exit fullscreen
            </button>
          )}
        </div>

        <aside className="focus-side-panel">
          <div className="focus-score-grid">
            <div><span>Score</span><strong>{score.toLocaleString()}</strong></div>
            <div><span>High Score</span><strong>{stats.highestScore.toLocaleString()}</strong></div>
            <div><span>Level</span><strong>{level}</strong></div>
            <div><span>Lines</span><strong>{lines}</strong></div>
            <div><span>Time</span><strong>{formatTime(elapsedSeconds)}</strong></div>
            <div><span>Combo</span><strong>{combo}x</strong></div>
          </div>

          <div className={`focus-next-card focus-hold-card${!canHold ? ' locked' : ''}`}>
            <span className="metric-label">Reserve block <small>C</small></span>
            <div className="focus-next-grid">
              {Array.from({ length: 16 }, (_, index) => {
                const x = index % 4;
                const y = Math.floor(index / 4);
                const active = heldPiece?.shape[y]?.[x];
                return <i key={index} className={active ? 'active' : ''} style={active && heldPiece ? { '--cell-color': heldPiece.color } : undefined} />;
              })}
            </div>
            <p>{heldPiece ? (canHold ? 'Press C to swap with the current block.' : 'Reserve used. Lock this block to hold again.') : 'Press C to store your current block.'}</p>
          </div>

          <div className="focus-next-card">
            <span className="metric-label">Next block</span>
            <div className="focus-next-grid">
              {Array.from({ length: 16 }, (_, index) => {
                const x = index % 4;
                const y = Math.floor(index / 4);
                const active = nextPiece.shape[y]?.[x];
                return <i key={index} className={active ? 'active' : ''} style={active ? { '--cell-color': nextPiece.color } : undefined} />;
              })}
            </div>
          </div>

          <div className="focus-actions">
            <button className="dash-submit-btn" type="button" onClick={running ? () => setPaused(value => !value) : startGame}>
              {running && !paused ? <Pause size={15} /> : <Play size={15} />} {running && !paused ? 'Pause' : 'Start'}
            </button>
            <button className="dash-cancel-btn" type="button" onClick={confirmRestart}><RotateCcw size={15} /> Restart</button>
            <button className="dash-cancel-btn" type="button" onClick={toggleFullscreen}>
              {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />} {fullscreen ? 'Exit' : 'Fullscreen'}
            </button>
          </div>

          <div className="focus-controls-card">
            <span className="metric-label">Controls</span>
            <p>Left and right move with repeat. Down soft drops. Up rotates clockwise, Z rotates back, Space hard drops, C holds, P or Esc pauses, and R restarts.</p>
            <div className="focus-difficulty-group" aria-label="TaskTris difficulty">
              {difficultyOptions.map(option => (
                <button
                  type="button"
                  key={option.id}
                  className={difficultyId === option.id ? 'active' : ''}
                  disabled={running && !gameOver}
                  onClick={() => {
                    setDifficultyId(option.id);
                    if (!running || gameOver) setLevel(option.startLevel);
                  }}
                >
                  <strong>{option.label}</strong>
                  <span>{option.description}</span>
                </button>
              ))}
            </div>
            <div className="focus-preference-row">
              <button type="button" onClick={() => setSoundOn(value => !value)}>{soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />} Sound</button>
              <button type="button" onClick={() => setReducedMotion(value => !value)}>{reducedMotion ? 'Standard speed' : 'Reduced motion'}</button>
              <button type="button" onClick={() => setHighContrast(value => !value)}>{highContrast ? 'Soft contrast' : 'High contrast'}</button>
            </div>
            <details className="focus-keybinds">
              <summary>Customize keys</summary>
              <div className="focus-keybind-grid">
                {Object.entries(keyBindingLabels).map(([action, label]) => (
                  <button
                    type="button"
                    key={action}
                    className={bindingToEdit === action ? 'listening' : ''}
                    onClick={() => setBindingToEdit(action)}
                  >
                    <span>{label}</span>
                    <strong>{bindingToEdit === action ? 'Press key' : displayKey(keyBindings[action])}</strong>
                  </button>
                ))}
              </div>
              <button
                className="focus-key-reset"
                type="button"
                onClick={() => {
                  setKeyBindings(defaultKeyBindings);
                  setBindingToEdit(null);
                }}
              >
                Reset default keys
              </button>
            </details>
          </div>
        </aside>
      </div>

      {restartPromptOpen && (
        <div className="focus-dialog-backdrop" role="presentation" onClick={() => setRestartPromptOpen(false)}>
          <div className="focus-dialog" role="dialog" aria-modal="true" aria-labelledby="tasktris-restart-title" onClick={event => event.stopPropagation()}>
            <span className="metric-label">TaskTris</span>
            <h2 id="tasktris-restart-title">Restart this game?</h2>
            <p>Your current score and board will reset. This starts a fresh TaskTris round with the selected difficulty.</p>
            <div className="focus-dialog-actions">
              <button type="button" className="dash-cancel-btn" onClick={() => setRestartPromptOpen(false)}>Cancel</button>
              <button
                type="button"
                className="dash-submit-btn"
                onClick={() => {
                  setRestartPromptOpen(false);
                  saveCurrentRound();
                  resetGame(true);
                }}
              >
                <RotateCcw size={15} /> Restart
              </button>
            </div>
          </div>
        </div>
      )}

      <article className="focus-panel">
        <div className="dashboard-card-head">
          <div>
            <span className="metric-label">Themes</span>
            <h2>Block skins</h2>
          </div>
        </div>
        <div className="focus-skin-grid">
          {skinOptions.map(option => (
            <button className={skin === option.id ? 'active' : ''} key={option.id} type="button" onClick={() => setSkin(option.id)}>
              <i style={{ background: option.board }} />
              {option.label}
            </button>
          ))}
        </div>
      </article>

      <article className="focus-panel">
        <div className="dashboard-card-head">
          <div>
            <span className="metric-label">Statistics</span>
            <h2>Personal best</h2>
          </div>
        </div>
        <div className="focus-stats-list">
          <span>Games played <strong>{stats.gamesPlayed}</strong></span>
          <span>Average score <strong>{averageScore.toLocaleString()}</strong></span>
          <span>Longest survival <strong>{formatTime(stats.longestSurvival)}</strong></span>
          <span>Highest level <strong>{stats.highestLevel}</strong></span>
          <span>Total lines <strong>{stats.linesCleared}</strong></span>
          <span>Total play time <strong>{formatTime(stats.totalPlayTime)}</strong></span>
        </div>
      </article>

      <article className="focus-panel focus-achievements">
        <div className="dashboard-card-head">
          <div>
            <span className="metric-label">Achievements</span>
            <h2>Focus milestones</h2>
          </div>
        </div>
        <div className="focus-achievement-grid">
          {achievementCatalog.map(item => (
            <div className={unlockedAchievements.has(item.id) ? 'unlocked' : ''} key={item.id}>
              <Trophy size={16} />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

export default FocusBreak;
