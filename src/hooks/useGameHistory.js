import { useEffect, useState } from "react";

import {
  GAME_HISTORY_UPDATE_EVENT,
  getGameRecords,
} from "../utils/gameHistoryDb";

/** Listens to the recorded game history for a given user; null while loading. */
function useGameHistory(userId) {
  const [games, setGames] = useState(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    function load() {
      getGameRecords(userId).then((records) => {
        if (!cancelled) setGames(records);
      });
    }

    load();
    window.addEventListener(GAME_HISTORY_UPDATE_EVENT, load);
    return () => {
      cancelled = true;
      window.removeEventListener(GAME_HISTORY_UPDATE_EVENT, load);
    };
  }, [userId]);

  return games;
}

export default useGameHistory;
