const STATS_KEY = "swf_stats";

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

export function readLocalStats(userId) {
  return loadAll()[userId] ?? null;
}

export function recordGame(userId, { mode, sets, duration }) {
  const all = loadAll();
  const userStats = all[userId] ?? {};

  userStats[mode] ??= {};
  userStats[mode].solo ??= {};

  const s = userStats[mode].solo;
  s.finishedGames = (s.finishedGames ?? 0) + 1;
  s.wonGames = (s.wonGames ?? 0) + 1; // solo games are always completed
  s.totalSets = (s.totalSets ?? 0) + sets;
  // null means no prior fastest time; Infinity can't be JSON-serialized
  s.fastestTime = s.fastestTime === null || s.fastestTime === undefined
    ? duration
    : Math.min(s.fastestTime, duration);
  s.totalTime = (s.totalTime ?? 0) + duration;

  all[userId] = userStats;
  saveAll(all);
}
