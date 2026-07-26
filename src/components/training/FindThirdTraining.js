import AlarmIcon from "@mui/icons-material/Alarm";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import makeStyles from "@mui/styles/makeStyles";
import { lightGreen, red } from "@mui/material/colors";
import { useContext, useEffect, useRef, useState } from "react";
import useSound from "use-sound";

import failSfx from "../../assets/failedSetSound.mp3";
import foundSfx from "../../assets/successfulSetSound.mp3";
import { SettingsContext, UserContext } from "../../context";
import { conjugateCard, formatTime, generateCards } from "../../util";
import useKeydown from "../../hooks/useKeydown";
import { readTrainingStats, recordTrainingRound } from "../../utils/trainingStats";
import Game from "../Game";
import Subheading from "../Subheading";
import FindThirdLog from "./FindThirdLog";

const TRAINING_TYPE = "find-third";
const BOARD_SIZE = 12;
const ROUND_SECONDS = 60;
const NEXT_ROUND_DELAY = 250;
const THIRD_CARD_PROBABILITY = 0.6;

const EMPTY_STATS = { roundsPlayed: 0, correct: 0, totalTime: 0, bestTime: null };

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function newRound() {
  const deck = shuffle(generateCards());
  const [a, b] = deck;
  const conjugate = conjugateCard(a, b);
  const hasThird = Math.random() < THIRD_CARD_PROBABILITY;
  // conjugate can never equal a or b, so filtering it out of the
  // remaining pool is enough to guarantee its presence/absence on the board.
  const rest = deck.slice(2).filter((card) => card !== conjugate);
  const filler = rest.slice(0, BOARD_SIZE - (hasThird ? 3 : 2));
  const board = shuffle(
    hasThird ? [a, b, conjugate, ...filler] : [a, b, ...filler]
  );
  const prompt = [a, b];
  return {
    board,
    prompt,
    conjugate,
    hasThird,
    revealed: false,
    startedAt: Date.now(),
  };
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
    flexDirection: "column",
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
  scoreRow: {
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
  actions: {
    display: "flex",
    justifyContent: "center",
    marginTop: theme.spacing(2),
  },
  overlay: {
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
  overlayModal: {
    padding: theme.spacing(3),
    textAlign: "center",
  },
  wrapper: {
    position: "relative",
    width: "100%",
  },
}));

function FindThirdTraining() {
  const classes = useStyles();
  const { volume } = useContext(SettingsContext);
  const user = useContext(UserContext);
  const [round, setRound] = useState(newRound);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [logEntries, setLogEntries] = useState([]);
  const [lifetimeStats, setLifetimeStats] = useState(
    () => readTrainingStats(user.id, TRAINING_TYPE) ?? EMPTY_STATS
  );
  const [playSuccess] = useSound(foundSfx);
  const [playFail] = useSound(failSfx);
  const gameOverRef = useRef(false);
  const nextRoundTimeout = useRef(null);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  useEffect(() => {
    if (gameOver) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          setGameOver(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [gameOver]);

  useEffect(() => {
    return () => {
      if (nextRoundTimeout.current) clearTimeout(nextRoundTimeout.current);
    };
  }, []);

  function handleGuess(guessedCard) {
    if (round.revealed || gameOver) return;
    const correctGuess = round.hasThird ? round.conjugate : null;
    const isCorrect = guessedCard === correctGuess;
    const elapsed = Date.now() - round.startedAt;

    setScore((s) => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      total: s.total + 1,
    }));
    setRound((r) => ({ ...r, revealed: true }));
    setFeedback(guessedCard ? { card: guessedCard, correct: isCorrect } : null);
    setLogEntries((entries) => [
      ...entries,
      {
        id: `${round.startedAt}_${entries.length}`,
        correct: isCorrect,
        elapsed,
        prompt: round.prompt,
        conjugate: round.conjugate,
        hasThird: round.hasThird,
      },
    ]);
    setLifetimeStats(
      recordTrainingRound(user.id, TRAINING_TYPE, {
        correct: isCorrect,
        elapsed,
      })
    );

    if (isCorrect) {
      if (volume === "on") playSuccess();
    } else {
      if (volume === "on") playFail();
    }

    nextRoundTimeout.current = setTimeout(() => {
      if (gameOverRef.current) return;
      setRound(newRound());
      setFeedback(null);
    }, NEXT_ROUND_DELAY);
  }

  useKeydown((event) => {
    if (event.code === "Space") {
      event.preventDefault();
      handleGuess(null);
    }
  });

  function handleClick(card) {
    if (round.prompt.includes(card)) return;
    handleGuess(card);
  }

  function handleRestart() {
    if (nextRoundTimeout.current) clearTimeout(nextRoundTimeout.current);
    setRound(newRound());
    setScore({ correct: 0, total: 0 });
    setTimeLeft(ROUND_SECONDS);
    setGameOver(false);
    setFeedback(null);
    setLogEntries([]);
  }

  const answer =
    round.revealed && round.hasThird ? [round.conjugate] : null;

  const cardBackgrounds = feedback
    ? { [feedback.card]: feedback.correct ? lightGreen[200] : red[200] }
    : {};

  const accuracy =
    lifetimeStats.roundsPlayed > 0
      ? Math.round((lifetimeStats.correct / lifetimeStats.roundsPlayed) * 100)
      : null;
  const avgTime =
    lifetimeStats.correct > 0
      ? lifetimeStats.totalTime / lifetimeStats.correct
      : null;

  return (
    <Grid container spacing={2}>
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
              {timeLeft}s
            </Typography>
          </div>
          <Divider style={{ margin: "8px 0" }} />
          <div className={classes.scoreRow}>
            <Typography variant="body2" color="textSecondary">
              This session
            </Typography>
            <Typography variant="body2">
              <strong>
                {score.correct} / {score.total}
              </strong>
            </Typography>
          </div>
          <Divider style={{ margin: "8px 0" }} />
          <Subheading>All-Time Stats</Subheading>
          <div className={classes.scoreRow}>
            <Typography variant="body2" color="textSecondary">
              Rounds played
            </Typography>
            <Typography variant="body2">{lifetimeStats.roundsPlayed}</Typography>
          </div>
          <div className={classes.scoreRow}>
            <Typography variant="body2" color="textSecondary">
              Accuracy
            </Typography>
            <Typography variant="body2">
              {accuracy === null ? "—" : `${accuracy}%`}
            </Typography>
          </div>
          <div className={classes.scoreRow}>
            <Typography variant="body2" color="textSecondary">
              Avg. time (correct)
            </Typography>
            <Typography variant="body2">
              {avgTime === null ? "—" : formatTime(avgTime)}
            </Typography>
          </div>
          <div className={classes.scoreRow}>
            <Typography variant="body2" color="textSecondary">
              Best time
            </Typography>
            <Typography variant="body2">
              {lifetimeStats.bestTime == null
                ? "—"
                : formatTime(lifetimeStats.bestTime)}
            </Typography>
          </div>
        </Paper>

        <Paper className={classes.logPanel}>
          <FindThirdLog entries={logEntries} />
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
            className={classes.overlay}
            style={{
              opacity: gameOver ? 1 : 0,
              visibility: gameOver ? "visible" : "hidden",
            }}
          >
            <Paper elevation={3} className={classes.overlayModal}>
              <Typography variant="h5" gutterBottom>
                Time's up!
              </Typography>
              <Typography variant="body1" gutterBottom>
                You got {score.correct} / {score.total} correct.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleRestart}
                style={{ marginTop: 12 }}
              >
                Play Again
              </Button>
            </Paper>
          </div>

          <Game
            deck={round.board}
            boardSize={round.board.length}
            selected={round.prompt}
            onClick={handleClick}
            onClear={() => {}}
            gameMode="normal"
            lastSet={[]}
            answer={answer}
            cardBackgrounds={cardBackgrounds}
          />
        </div>

        <div className={classes.actions}>
          <Button
            variant="outlined"
            color="primary"
            disabled={round.revealed || gameOver}
            onClick={() => handleGuess(null)}
          >
            No Set (Space)
          </Button>
        </div>
      </Grid>
    </Grid>
  );
}

export default FindThirdTraining;
