import AlarmIcon from "@mui/icons-material/Alarm";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import makeStyles from "@mui/styles/makeStyles";
import { amber, blue, cyan, green, purple, red } from "@mui/material/colors";
import { useContext, useEffect, useRef, useState } from "react";
import useSound from "use-sound";

import failSfx from "../../assets/failedSetSound.mp3";
import foundSfx from "../../assets/successfulSetSound.mp3";
import { SettingsContext, UserContext } from "../../context";
import { checkSet, formatTime, generateCards, removeCard } from "../../util";
import useMoment from "../../hooks/useMoment";
import { readTrainingStats, recordTrainingGame } from "../../utils/trainingStats";
import Game from "../Game";
import SnackContent from "../SnackContent";
import Subheading from "../Subheading";
import FindAllSetsLog from "./FindAllSetsLog";

const TRAINING_TYPE = "find-all";
const BOARD_SIZE = 12;
const GOAL_BOARDS = 5;
const NEXT_BOARD_DELAY = 900;

const EMPTY_STATS = { gamesCompleted: 0, totalSets: 0, totalTime: 0, bestTime: null };

// One color per found Set, cycling if more than 6 are found on a board.
const TICK_COLORS = [
  red[600],
  blue[600],
  green[600],
  amber[700],
  purple[500],
  cyan[700],
];

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function signature(cards) {
  return [...cards].sort().join(",");
}

function newBoard() {
  let board;
  let totalSets;
  do {
    board = shuffle(generateCards()).slice(0, BOARD_SIZE);
    totalSets = 0;
    for (let i = 0; i < board.length; i++) {
      for (let j = i + 1; j < board.length; j++) {
        for (let k = j + 1; k < board.length; k++) {
          if (checkSet(board[i], board[j], board[k])) totalSets++;
        }
      }
    }
  } while (totalSets === 0);
  return { board, totalSets };
}

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
  statsPanel: {
    padding: 8,
    marginBottom: theme.spacing(2),
  },
  timer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  alarm: {
    color: theme.custom.alarm,
    marginRight: 10,
    marginBottom: 3,
  },
  statRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0 8px",
  },
  logPanel: {
    display: "flex",
    flexDirection: "column",
    height: 260,
    padding: 8,
  },
  wrapper: {
    position: "relative",
    width: "100%",
  },
  doneOverlay: {
    position: "absolute",
    width: "calc(100% - 16px)",
    height: "calc(100% - 16px)",
    borderRadius: 4,
    background: "rgba(0, 0, 0, 0.5)",
    zIndex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  doneModal: {
    padding: theme.spacing(3),
    textAlign: "center",
  },
}));

function FindAllSetsTraining() {
  const classes = useStyles();
  const { volume } = useContext(SettingsContext);
  const user = useContext(UserContext);
  const [{ board, totalSets }, setBoardState] = useState(newBoard);
  const [boardIndex, setBoardIndex] = useState(1);
  const [boardsClearedCount, setBoardsClearedCount] = useState(0);
  const [selected, setSelected] = useState([]);
  const [foundSets, setFoundSets] = useState([]);
  const [totalSetsFound, setTotalSetsFound] = useState(0);
  const [logEntries, setLogEntries] = useState([]);
  const [snack, setSnack] = useState({ open: false });
  const [boardCleared, setBoardCleared] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [lifetimeStats, setLifetimeStats] = useState(
    () => readTrainingStats(user.id, TRAINING_TYPE) ?? EMPTY_STATS
  );
  const [playSuccess] = useSound(foundSfx);
  const [playFail] = useSound(failSfx);

  const gameStartedAtRef = useRef(Date.now());
  const gameEndedAtRef = useRef(null);
  const boardStartedAtRef = useRef(Date.now());
  const lastEventAtRef = useRef(Date.now());
  const nextBoardTimeout = useRef(null);

  useEffect(() => {
    return () => {
      if (nextBoardTimeout.current) clearTimeout(nextBoardTimeout.current);
    };
  }, []);

  const time = useMoment(500);
  const gameTime = gameOver ? gameEndedAtRef.current : time;

  const done = boardCleared || gameOver;

  const cardTicks = {};
  foundSets.forEach((set, i) => {
    const color = TICK_COLORS[i % TICK_COLORS.length];
    set.cards.forEach((card) => {
      (cardTicks[card] ??= []).push(color);
    });
  });

  function handleClick(card) {
    if (done) return;
    setSelected((prev) => {
      if (prev.includes(card)) {
        return removeCard(prev, card);
      }
      const vals = [...prev, card];
      if (vals.length === 3) {
        if (checkSet(...vals)) {
          const sig = signature(vals);
          if (foundSets.some((set) => set.signature === sig)) {
            setSnack({
              open: true,
              variant: "info",
              message: "You already found that Set.",
            });
          } else {
            if (volume === "on") playSuccess();
            const now = Date.now();
            const elapsed = now - lastEventAtRef.current;
            lastEventAtRef.current = now;

            const newFoundSets = [...foundSets, { signature: sig, cards: vals }];
            setFoundSets(newFoundSets);
            setTotalSetsFound((n) => n + 1);
            setLogEntries((entries) => [
              ...entries,
              { id: `s_${now}`, type: "set", cards: vals, elapsed },
            ]);
            setSnack({
              open: true,
              variant: "success",
              message: "Found a Set!",
            });

            if (newFoundSets.length === totalSets) {
              handleBoardCleared(now);
            }
          }
        } else {
          if (volume === "on") playFail();
          setSnack({ open: true, variant: "error", message: "Not a Set!" });
        }
        return [];
      }
      return vals;
    });
  }

  function handleBoardCleared(now) {
    setBoardCleared(true);
    setBoardsClearedCount((n) => n + 1);
    setLogEntries((entries) => [
      ...entries,
      { id: `b_${now}`, type: "board", boardIndex, elapsed: now - boardStartedAtRef.current },
    ]);

    if (boardIndex === GOAL_BOARDS) {
      gameEndedAtRef.current = now;
      const gameElapsed = now - gameStartedAtRef.current;
      setLogEntries((entries) => [
        ...entries,
        { id: `g_${now}`, type: "game", elapsed: gameElapsed },
      ]);
      setGameOver(true);
      setLifetimeStats(
        recordTrainingGame(user.id, TRAINING_TYPE, {
          sets: totalSetsFound + 1,
          duration: gameElapsed,
        })
      );
    } else {
      nextBoardTimeout.current = setTimeout(() => {
        setBoardState(newBoard());
        setBoardIndex((i) => i + 1);
        setFoundSets([]);
        setSelected([]);
        setBoardCleared(false);
        boardStartedAtRef.current = Date.now();
        lastEventAtRef.current = Date.now();
      }, NEXT_BOARD_DELAY);
    }
  }

  function handleRestart() {
    if (nextBoardTimeout.current) clearTimeout(nextBoardTimeout.current);
    setBoardState(newBoard());
    setBoardIndex(1);
    setBoardsClearedCount(0);
    setSelected([]);
    setFoundSets([]);
    setTotalSetsFound(0);
    setLogEntries([]);
    setSnack({ open: false });
    setBoardCleared(false);
    setGameOver(false);
    gameStartedAtRef.current = Date.now();
    gameEndedAtRef.current = null;
    boardStartedAtRef.current = Date.now();
    lastEventAtRef.current = Date.now();
  }

  function handleClose(event, reason) {
    if (reason === "clickaway") return;
    setSnack({ ...snack, open: false });
  }

  const avgTime =
    lifetimeStats.gamesCompleted > 0
      ? lifetimeStats.totalTime / lifetimeStats.gamesCompleted
      : null;

  return (
    <Grid container spacing={2}>
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

      <Grid
        item
        xs={12}
        sm={4}
        md={3}
        order={{ xs: 2, sm: 1 }}
        className={classes.sideColumn}
      >
        <Paper className={classes.statsPanel}>
          <div className={classes.timer} style={{ marginTop: 6 }}>
            <AlarmIcon className={classes.alarm} fontSize="large" />
            <Typography variant="h4" align="center">
              {formatTime(gameTime - gameStartedAtRef.current, !gameOver)}
            </Typography>
          </div>
          <Divider style={{ margin: "8px 0" }} />
          <div className={classes.statRow}>
            <Typography variant="body2" color="textSecondary">
              Boards cleared
            </Typography>
            <Typography variant="body2">
              <strong>
                {boardsClearedCount} / {GOAL_BOARDS}
              </strong>
            </Typography>
          </div>
          <div className={classes.statRow}>
            <Typography variant="body2" color="textSecondary">
              This board
            </Typography>
            <Typography variant="body2">
              {foundSets.length} / {totalSets} Sets
            </Typography>
          </div>
          <Divider style={{ margin: "8px 0" }} />
          <Subheading>All-Time Stats</Subheading>
          <div className={classes.statRow}>
            <Typography variant="body2" color="textSecondary">
              Games completed
            </Typography>
            <Typography variant="body2">{lifetimeStats.gamesCompleted}</Typography>
          </div>
          <div className={classes.statRow}>
            <Typography variant="body2" color="textSecondary">
              Total sets found
            </Typography>
            <Typography variant="body2">{lifetimeStats.totalSets}</Typography>
          </div>
          <div className={classes.statRow}>
            <Typography variant="body2" color="textSecondary">
              Avg. time / game
            </Typography>
            <Typography variant="body2">
              {avgTime === null ? "—" : formatTime(avgTime, true)}
            </Typography>
          </div>
          <div className={classes.statRow}>
            <Typography variant="body2" color="textSecondary">
              Best time
            </Typography>
            <Typography variant="body2">
              {lifetimeStats.bestTime == null
                ? "—"
                : formatTime(lifetimeStats.bestTime, true)}
            </Typography>
          </div>
        </Paper>

        <Paper className={classes.logPanel}>
          <FindAllSetsLog entries={logEntries} />
        </Paper>
      </Grid>

      <Grid
        item
        xs={12}
        sm={8}
        md={9}
        order={{ xs: 1, sm: 2 }}
        className={classes.mainColumn}
      >
        <div className={classes.wrapper}>
          <div
            className={classes.doneOverlay}
            style={{
              opacity: done ? 1 : 0,
              visibility: done ? "visible" : "hidden",
            }}
          >
            <Paper elevation={3} className={classes.doneModal}>
              {gameOver ? (
                <>
                  <Typography variant="h5" gutterBottom>
                    All {GOAL_BOARDS} boards cleared!
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Total time:{" "}
                    <strong>
                      {formatTime(gameEndedAtRef.current - gameStartedAtRef.current, true)}
                    </strong>
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleRestart}
                    style={{ marginTop: 12 }}
                  >
                    Play Again
                  </Button>
                </>
              ) : (
                <Typography variant="h5">
                  Board {boardIndex} cleared!
                </Typography>
              )}
            </Paper>
          </div>

          <Game
            deck={board}
            boardSize={board.length}
            selected={selected}
            onClick={handleClick}
            onClear={() => setSelected([])}
            gameMode="normal"
            lastSet={[]}
            cardTicks={cardTicks}
          />
        </div>
      </Grid>
    </Grid>
  );
}

export default FindAllSetsTraining;
