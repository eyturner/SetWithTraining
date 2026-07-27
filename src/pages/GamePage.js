import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import makeStyles from "@mui/styles/makeStyles";
import { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useSound from "use-sound";

import failSfx from "../assets/failedSetSound.mp3";
import foundSfx from "../assets/successfulSetSound.mp3";
import Chat from "../components/Chat";
import Game from "../components/Game";
import GameSidebar from "../components/GameSidebar";
import SnackContent from "../components/SnackContent";
import { SettingsContext, UserContext } from "../context";
import useKeydown from "../hooks/useKeydown";
import { addGameRecord, computeSetTimingStats } from "../utils/gameHistoryDb";
import { recordGame } from "../utils/localStats";
import { enqueueSlowSet } from "../utils/srsQueue";
import {
  checkSet,
  checkSetUltra,
  computeState,
  findSet,
  generateCards,
  hasHint,
  removeCard,
} from "../util";

const useStyles = makeStyles((theme) => ({
  sideColumn: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    [theme.breakpoints.up("lg")]: {
      maxHeight: 543,
    },
    [theme.breakpoints.down("lg")]: {
      maxHeight: 435,
    },
    [theme.breakpoints.down("sm")]: {
      maxHeight: 400,
    },
  },
  mainColumn: {
    display: "flex",
    alignItems: "center",
  },
  doneOverlay: {
    position: "absolute",
    width: "calc(100% - 16px)",
    height: "calc(100% - 16px)",
    borderRadius: 4,
    background: "rgba(0, 0, 0, 0.5)",
    transition: "opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    zIndex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  doneModal: {
    padding: theme.spacing(3),
    textAlign: "center",
  },
  chatPanel: {
    display: "flex",
    flexDirection: "column",
    height: 200,
    marginTop: theme.spacing(2),
    padding: 8,
  },
}));

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function newGameData() {
  return { deck: shuffle(generateCards()), events: {} };
}

function GamePage() {
  const user = useContext(UserContext);
  const { volume, slowSetThreshold } = useContext(SettingsContext);
  const classes = useStyles();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const mode = searchParams.get("mode") || "normal";
  const enableHint = searchParams.get("hint") === "true";

  const [game, setGame] = useState(() => ({
    mode,
    status: "ingame",
    startedAt: Date.now(),
    endedAt: null,
    host: user.id,
    users: { [user.id]: Date.now() },
    access: "private",
    enableHint,
  }));
  const [gameData, setGameData] = useState(newGameData);

  const [selected, setSelected] = useState([]);
  const [snack, setSnack] = useState({ open: false });
  const [numHints, setNumHints] = useState(0);

  const [playSuccess] = useSound(foundSfx);
  const [playFail] = useSound(failSfx);

  useEffect(() => {
    setSelected([]);
    setNumHints(0);
  }, [gameData]);

  const gameMode = game.mode || "normal";
  const { current, scores, history, boardSize } = computeState(
    gameData,
    gameMode,
  );

  const finishing = useRef(false);
  useEffect(() => {
    if (game.status === "ingame" && !finishing.current) {
      let hasSet = false;
      if (gameMode === "setchain" && history.length > 0) {
        const { c1, c2, c3 } = history[history.length - 1];
        hasSet = findSet(current, gameMode, [c1, c2, c3]);
      } else {
        hasSet = findSet(current, gameMode, []);
      }
      if (!hasSet) {
        finishing.current = true;
        setGame((prev) => ({ ...prev, status: "done", endedAt: Date.now() }));
        finishing.current = false;
      }
    }
  });

  const recordedGameRef = useRef(null);
  useEffect(() => {
    if (game.status !== "done") return;
    if (recordedGameRef.current === game.startedAt) return;
    recordedGameRef.current = game.startedAt;
    recordGame(user.id, {
      mode: gameMode,
      sets: scores[user.id] || 0,
      duration: game.endedAt - game.startedAt,
    });

    const setTimes = history.map((event, i) =>
      i === 0 ? event.time - game.startedAt : event.time - history[i - 1].time,
    );
    const { avgSetTime, longestSetTime } = computeSetTimingStats(setTimes);
    addGameRecord(user.id, {
      mode: gameMode,
      numSets: scores[user.id] || 0,
      duration: game.endedAt - game.startedAt,
      avgSetTime,
      longestSetTime,
      playedAt: game.startedAt,
    });
    // scores/history are new references each render but their values are
    // stable once game.status is "done", so we omit them from deps intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.status, game.startedAt, game.endedAt, gameMode, user.id]);

  useKeydown((event) => {
    if (event.ctrlKey === true && event.keyCode === 13 && game.status === "done") {
      handlePlayAgain();
    }
  });

  let lastSet = [];
  if (gameMode === "setchain" && history.length > 0) {
    const { c1, c2, c3 } = history[history.length - 1];
    lastSet = [c1, c2, c3];
  }

  const maxHints = gameMode === "ultraset" ? 4 : 3;
  let answer = findSet(current.slice(0, boardSize), gameMode, lastSet);
  if (hasHint(game) && answer) {
    answer = answer.slice(0, numHints);
  } else {
    answer = null;
  }

  function handleSet(cards) {
    const event =
      gameMode === "ultraset"
        ? { c1: cards[0], c2: cards[1], c3: cards[2], c4: cards[3] }
        : { c1: cards[0], c2: cards[1], c3: cards[2] };
    const key = `e_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    if (gameMode === "normal" || gameMode === "setjr") {
      const lastTime = history.length
        ? history[history.length - 1].time
        : game.startedAt;
      const elapsed = Date.now() - lastTime;
      if (elapsed > Number(slowSetThreshold) * 1000) {
        enqueueSlowSet(user.id, {
          board: current.slice(0, boardSize),
          cards,
          gameMode,
        });
      }
    }

    setGameData((prev) => ({
      ...prev,
      events: {
        ...prev.events,
        [key]: { ...event, user: user.id, time: Date.now() },
      },
    }));
  }

  function handleClick(card) {
    if (game.status !== "ingame") return;
    setSelected((selected) => {
      if (selected.includes(card)) {
        return removeCard(selected, card);
      }
      if (gameMode === "normal" || gameMode === "setjr") {
        const vals = [...selected, card];
        if (vals.length === 3) {
          if (checkSet(...vals)) {
            handleSet(vals);
            if (volume === "on") playSuccess();
            setSnack({ open: true, variant: "success", message: "Found a set!" });
          } else {
            if (volume === "on") playFail();
            setSnack({ open: true, variant: "error", message: "Not a set!" });
          }
          return [];
        }
        return vals;
      } else if (gameMode === "ultraset") {
        const vals = [...selected, card];
        if (vals.length === 4) {
          const res = checkSetUltra(...vals);
          if (res) {
            handleSet(res);
            if (volume === "on") playSuccess();
            setSnack({ open: true, variant: "success", message: "Found an UltraSet!" });
          } else {
            if (volume === "on") playFail();
            setSnack({ open: true, variant: "error", message: "Not an UltraSet!" });
          }
          return [];
        }
        return vals;
      } else if (gameMode === "setchain") {
        let vals = [];
        if (lastSet.includes(card)) {
          if (selected.length > 0 && lastSet.includes(selected[0])) {
            return [card, ...selected.slice(1)];
          }
          vals = [card, ...selected];
        } else {
          vals = [...selected, card];
        }
        if (vals.length === 3) {
          if (lastSet.length > 0 && !lastSet.includes(vals[0])) {
            if (volume === "on") playFail();
            setSnack({
              open: true,
              variant: "error",
              message: "One card must be from the previous set!",
            });
          } else if (checkSet(...vals)) {
            handleSet(vals);
            if (volume === "on") playSuccess();
            setSnack({ open: true, variant: "success", message: "Found a set chain!" });
          } else {
            if (volume === "on") playFail();
            setSnack({ open: true, variant: "error", message: "Not a set chain!" });
          }
          return [];
        }
        return vals;
      }
      return selected;
    });
  }

  function handleClear() {
    setSelected([]);
  }

  function handleClose(event, reason) {
    if (reason === "clickaway") return;
    setSnack({ ...snack, open: false });
  }

  function handleAddHint() {
    setNumHints((n) => Math.min(n + 1, maxHints));
  }

  function handlePlayAgain() {
    finishing.current = false;
    setGame({
      mode,
      status: "ingame",
      startedAt: Date.now(),
      endedAt: null,
      host: user.id,
      users: { [user.id]: Date.now() },
      access: "private",
      enableHint,
    });
    setGameData(newGameData());
    setSelected([]);
    setSnack({ open: false });
    setNumHints(0);
  }

  return (
    <Container sx={{ pb: 2 }}>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={snack.open}
        autoHideDuration={2000}
        onClose={handleClose}
      >
        <SnackContent
          variant={snack.variant || "info"}
          message={snack.message || ""}
          onClose={handleClose}
        />
      </Snackbar>
      <Grid container spacing={2}>
        <Grid
          item
          xs={12}
          sm={4}
          md={3}
          order={{ xs: 2, sm: 1 }}
          className={classes.sideColumn}
        >
          <GameSidebar game={game} scores={scores} />
          <Paper className={classes.chatPanel}>
            <Chat
              title="Set Log"
              history={history}
              gameMode={gameMode}
              startedAt={game.startedAt}
            />
          </Paper>
          <Box mt={2}>
            {hasHint(game) && (
              <Button
                size="medium"
                variant="outlined"
                color="primary"
                fullWidth
                disabled={
                  numHints === maxHints || !answer || game.status === "done"
                }
                onClick={handleAddHint}
              >
                Add hint: {numHints}
              </Button>
            )}
            <Button
              size="medium"
              variant="text"
              color="inherit"
              fullWidth
              onClick={() => navigate("/")}
              style={{ marginTop: 8 }}
            >
              Back to Lobby
            </Button>
          </Box>
        </Grid>

        <Grid
          item
          xs={12}
          sm={8}
          md={9}
          order={{ xs: 1, sm: 2 }}
          position="relative"
          className={classes.mainColumn}
        >
          <div
            className={classes.doneOverlay}
            style={{
              opacity: game.status === "done" ? 1 : 0,
              visibility: game.status === "done" ? "visible" : "hidden",
            }}
          >
            <Paper elevation={3} className={classes.doneModal}>
              <Typography variant="h5" gutterBottom>
                Game over!
              </Typography>
              <Typography variant="body1" gutterBottom>
                Sets found: <strong>{scores[user.id] || 0}</strong>
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handlePlayAgain}
                style={{ marginTop: 12 }}
              >
                Play Again
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate("/")}
                style={{ marginTop: 8, marginLeft: 8 }}
              >
                Back to Lobby
              </Button>
            </Paper>
          </div>

          <Game
            deck={current}
            boardSize={boardSize}
            selected={selected}
            onClick={handleClick}
            onClear={handleClear}
            gameMode={gameMode}
            lastSet={lastSet}
            answer={answer}
          />
        </Grid>
      </Grid>
    </Container>
  );
}

export default GamePage;
