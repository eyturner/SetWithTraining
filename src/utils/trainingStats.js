const STATS_KEY = "swf_training_stats";

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY)) ?? {};
  } catch {
    return {};
  }
}

function saveAll(data) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable (private browsing, storage full, etc.)
  }
}

export function readTrainingStats(userId, trainingType) {
  return loadAll()[userId]?.[trainingType] ?? null;
}

/** Records one training round and returns the updated stats for that type. */
export function recordTrainingRound(userId, trainingType, { correct, elapsed }) {
  const all = loadAll();
  const userStats = all[userId] ?? {};
  const s = userStats[trainingType] ?? {};

  s.roundsPlayed = (s.roundsPlayed ?? 0) + 1;
  s.correct = (s.correct ?? 0) + (correct ? 1 : 0);
  if (correct) {
    s.totalTime = (s.totalTime ?? 0) + elapsed;
    // null means no prior best time; Infinity can't be JSON-serialized
    s.bestTime =
      s.bestTime === undefined || s.bestTime === null
        ? elapsed
        : Math.min(s.bestTime, elapsed);
  }

  userStats[trainingType] = s;
  all[userId] = userStats;
  saveAll(all);

  return s;
}

/** Records one completed training game and returns the updated stats for that type. */
export function recordTrainingGame(userId, trainingType, { sets, duration }) {
  const all = loadAll();
  const userStats = all[userId] ?? {};
  const s = userStats[trainingType] ?? {};

  s.gamesCompleted = (s.gamesCompleted ?? 0) + 1;
  s.totalSets = (s.totalSets ?? 0) + sets;
  s.totalTime = (s.totalTime ?? 0) + duration;
  // null means no prior best time; Infinity can't be JSON-serialized
  s.bestTime =
    s.bestTime === undefined || s.bestTime === null
      ? duration
      : Math.min(s.bestTime, duration);

  userStats[trainingType] = s;
  all[userId] = userStats;
  saveAll(all);

  return s;
}
