const SRS_KEY = "swf_srs_queue";

// Leitner box intervals: 10 min, 1 hour, 1 day, 3 days, 1 week.
export const LEITNER_INTERVALS_MS = [
  10 * 60 * 1000,
  60 * 60 * 1000,
  24 * 60 * 60 * 1000,
  3 * 24 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
];

function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(SRS_KEY)) ?? {};
  } catch {
    return {};
  }
}

function saveAll(data) {
  try {
    localStorage.setItem(SRS_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable (private browsing, storage full, etc.)
  }
}

export function enqueueSlowSet(userId, { board, cards, gameMode }) {
  const all = loadAll();
  const items = all[userId] ?? [];
  items.push({
    id: `srs_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    board,
    cards,
    gameMode,
    level: 0,
    dueAt: Date.now() + LEITNER_INTERVALS_MS[0],
    createdAt: Date.now(),
  });
  all[userId] = items;
  saveAll(all);
}

export function readQueue(userId) {
  return loadAll()[userId] ?? [];
}

export function getDueItems(userId) {
  const now = Date.now();
  return readQueue(userId).filter((item) => item.dueAt <= now);
}

export function reviewItem(userId, itemId, success) {
  const all = loadAll();
  const items = all[userId] ?? [];
  const idx = items.findIndex((item) => item.id === itemId);
  if (idx === -1) return;

  if (success) {
    const nextLevel = items[idx].level + 1;
    if (nextLevel >= LEITNER_INTERVALS_MS.length) {
      items.splice(idx, 1);
    } else {
      items[idx] = {
        ...items[idx],
        level: nextLevel,
        dueAt: Date.now() + LEITNER_INTERVALS_MS[nextLevel],
      };
    }
  } else {
    items[idx] = {
      ...items[idx],
      level: 0,
      dueAt: Date.now() + LEITNER_INTERVALS_MS[0],
    };
  }

  all[userId] = items;
  saveAll(all);
}
