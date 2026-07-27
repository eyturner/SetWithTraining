const DB_NAME = "swf_game_history";
const DB_VERSION = 1;
const STORE_NAME = "games";
const UPDATE_EVENT = "swf-game-history-updated";

let dbPromise = null;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === "undefined") {
        reject(new Error("IndexedDB is not available"));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: "id",
            autoIncrement: true,
          });
          store.createIndex("userId", "userId", { unique: false });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

/**
 * Given the elapsed durations (ms) between consecutive sets found in a game,
 * returns the average and longest time taken to find a single set.
 */
export function computeSetTimingStats(elapsedTimes) {
  if (!elapsedTimes.length) {
    return { avgSetTime: 0, longestSetTime: 0 };
  }
  const total = elapsedTimes.reduce((sum, t) => sum + t, 0);
  return {
    avgSetTime: total / elapsedTimes.length,
    longestSetTime: Math.max(...elapsedTimes),
  };
}

/** Records a completed game to the user's local game history. */
export async function addGameRecord(
  userId,
  { mode, numSets, duration, avgSetTime, longestSetTime, playedAt },
) {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).add({
        userId,
        mode,
        numSets,
        duration,
        avgSetTime,
        longestSetTime,
        playedAt: playedAt ?? Date.now(),
      });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  } catch {
    // IndexedDB unavailable (private browsing, unsupported browser, etc.)
  }
}

/** Retrieves all recorded games for a user, most recent first. */
export async function getGameRecords(userId) {
  try {
    const db = await openDb();
    const records = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).index("userId").getAll(userId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return records.sort((a, b) => b.playedAt - a.playedAt);
  } catch {
    return [];
  }
}

export { UPDATE_EVENT as GAME_HISTORY_UPDATE_EVENT };
