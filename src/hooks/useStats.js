import { useMemo, useSyncExternalStore } from "react";

import { BASE_RATING, modes } from "../util";
import { readLocalStats } from "../utils/localStats";

function subscribe(callback) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  try {
    return localStorage.getItem("swf_stats");
  } catch {
    return null;
  }
}

/** Listen to statistics for a given user, with filled in default values. */
function useStats(userId) {
  const raw = useSyncExternalStore(subscribe, getSnapshot);

  const stats = useMemo(() => {
    const value = userId ? readLocalStats(userId) : null;

    const stats = value ? { ...value } : {};
    for (const mode of Object.keys(modes)) {
      stats[mode] ??= {};
      stats[mode].rating ??= BASE_RATING;
      for (const variant of ["solo", "multiplayer"]) {
        stats[mode][variant] ??= {};
        stats[mode][variant].finishedGames ??= 0;
        stats[mode][variant].wonGames ??= 0;
        stats[mode][variant].totalSets ??= 0;
        // null means no games recorded yet; use Infinity as the identity for Math.min
        stats[mode][variant].fastestTime =
          stats[mode][variant].fastestTime ?? Infinity;
        stats[mode][variant].totalTime ??= 0;
      }
      const { solo, multiplayer } = stats[mode];
      stats[mode].all = {
        finishedGames: solo.finishedGames + multiplayer.finishedGames,
        wonGames: solo.wonGames + multiplayer.wonGames,
        totalSets: solo.totalSets + multiplayer.totalSets,
        fastestTime: Math.min(solo.fastestTime, multiplayer.fastestTime),
        totalTime: solo.totalTime + multiplayer.totalTime,
      };
    }

    return stats;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, raw]);

  return [stats, false];
}

export default useStats;
