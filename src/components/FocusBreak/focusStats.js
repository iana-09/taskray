const defaultStats = {
  gamesPlayed: 0,
  highestScore: 0,
  totalScore: 0,
  longestSurvival: 0,
  highestLevel: 1,
  linesCleared: 0,
  totalPlayTime: 0,
  weeklyBest: 0,
  monthlyBest: 0,
  achievements: [],
};

const storageKey = (userId) => `taskray-focus-break:${userId}`;

export const loadFocusStats = (userId) => {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(userId)) || 'null');
    return { ...defaultStats, ...(saved || {}) };
  } catch {
    return defaultStats;
  }
};

export const saveFocusStats = (userId, stats) => {
  localStorage.setItem(storageKey(userId), JSON.stringify({ ...defaultStats, ...stats }));
};

export const achievementCatalog = [
  { id: 'first-game', label: 'First Game', test: stats => stats.gamesPlayed >= 1 },
  { id: 'score-1000', label: 'Score 1,000 Points', test: stats => stats.highestScore >= 1000 },
  { id: 'level-10', label: 'Reach Level 10', test: stats => stats.highestLevel >= 10 },
  { id: 'clear-50', label: 'Clear 50 Lines', test: stats => stats.linesCleared >= 50 },
  { id: 'play-10', label: 'Play 10 Games', test: stats => stats.gamesPlayed >= 10 },
  { id: 'perfect-focus', label: 'Perfect Focus', test: stats => stats.completedTasksToday >= stats.totalTasksToday && stats.totalTasksToday > 0 },
];

export const updateStatsAfterGame = (currentStats, game, taskSummary) => {
  const next = {
    ...defaultStats,
    ...currentStats,
    gamesPlayed: currentStats.gamesPlayed + 1,
    highestScore: Math.max(currentStats.highestScore, game.score),
    totalScore: currentStats.totalScore + game.score,
    longestSurvival: Math.max(currentStats.longestSurvival, game.elapsedSeconds),
    highestLevel: Math.max(currentStats.highestLevel, game.level),
    linesCleared: currentStats.linesCleared + game.lines,
    totalPlayTime: currentStats.totalPlayTime + game.elapsedSeconds,
    weeklyBest: Math.max(currentStats.weeklyBest, game.score),
    monthlyBest: Math.max(currentStats.monthlyBest, game.score),
    completedTasksToday: taskSummary.completedToday,
    totalTasksToday: taskSummary.totalToday,
  };

  next.achievements = achievementCatalog
    .filter(item => item.test(next))
    .map(item => item.id);

  return next;
};
