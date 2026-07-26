import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import makeStyles from "@mui/styles/makeStyles";
import { useContext, useState } from "react";
import useSound from "use-sound";

import failSfx from "../../assets/failedSetSound.mp3";
import foundSfx from "../../assets/successfulSetSound.mp3";
import { SettingsContext, UserContext } from "../../context";
import { checkSet, removeCard } from "../../util";
import { getDueItems, readQueue, reviewItem } from "../../utils/srsQueue";
import Game from "../Game";
import SnackContent from "../SnackContent";

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

const useStyles = makeStyles((theme) => ({
  instructions: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  actions: {
    display: "flex",
    justifyContent: "center",
    gap: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
  emptyState: {
    padding: theme.spacing(3),
    textAlign: "center",
  },
}));

function HardBoardsTraining() {
  const classes = useStyles();
  const user = useContext(UserContext);
  const { volume } = useContext(SettingsContext);

  const [dueItems, setDueItems] = useState(() => getDueItems(user.id));
  const [totalQueued, setTotalQueued] = useState(
    () => readQueue(user.id).length,
  );
  const [board, setBoard] = useState(() =>
    dueItems[0] ? shuffle(dueItems[0].board) : [],
  );
  const [selected, setSelected] = useState([]);
  const [revealed, setRevealed] = useState(false);
  const [snack, setSnack] = useState({ open: false });
  const [playSuccess] = useSound(foundSfx);
  const [playFail] = useSound(failSfx);

  const currentItem = dueItems[0] || null;

  function refresh() {
    const next = getDueItems(user.id);
    setDueItems(next);
    setTotalQueued(readQueue(user.id).length);
    setBoard(next[0] ? shuffle(next[0].board) : []);
    setSelected([]);
    setRevealed(false);
  }

  function handleClick(card) {
    if (!currentItem || revealed) return;
    setSelected((prev) => {
      if (prev.includes(card)) {
        return removeCard(prev, card);
      }
      const vals = [...prev, card];
      if (vals.length === currentItem.cards.length) {
        if (checkSet(...vals)) {
          if (signature(vals) === signature(currentItem.cards)) {
            if (volume === "on") playSuccess();
            reviewItem(user.id, currentItem.id, true);
            setSnack({
              open: true,
              variant: "success",
              message: "Nice, you found it! Moving to the next board.",
            });
            refresh();
            return [];
          }
          setSnack({
            open: true,
            variant: "info",
            message:
              "That's a Set, but not the one you missed — keep looking!",
          });
        } else {
          if (volume === "on") playFail();
          setSnack({ open: true, variant: "error", message: "Not a Set!" });
        }
        return [];
      }
      return vals;
    });
  }

  function handleGiveUp() {
    if (!currentItem || revealed) return;
    reviewItem(user.id, currentItem.id, false);
    setRevealed(true);
    setSelected([]);
    setSnack({
      open: true,
      variant: "warning",
      message: "Here's the one you missed — it's highlighted below.",
    });
  }

  function handleNext() {
    refresh();
  }

  function handleClose(event, reason) {
    if (reason === "clickaway") return;
    setSnack({ ...snack, open: false });
  }

  const snackbar = (
    <Snackbar
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      open={snack.open}
      autoHideDuration={3000}
      onClose={handleClose}
    >
      <SnackContent
        variant={snack.variant || "info"}
        message={snack.message || ""}
        onClose={handleClose}
      />
    </Snackbar>
  );

  if (!currentItem) {
    return (
      <>
        {snackbar}
        <Paper className={classes.emptyState}>
          <Typography variant="h6" gutterBottom>
            {totalQueued === 0
              ? "Your practice queue is empty."
              : "Nothing due right now!"}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {totalQueued === 0
              ? "Play some solo games in Normal or Junior mode — any Set that takes longer than your slow-set threshold to find gets queued here automatically."
              : `You have ${totalQueued} board${
                  totalQueued === 1 ? "" : "s"
                } queued for later review.`}
          </Typography>
        </Paper>
      </>
    );
  }

  return (
    <>
      {snackbar}
      <Paper className={classes.instructions}>
        <Typography variant="body1" gutterBottom>
          This board tripped you up before. Find the Set you missed — the
          cards are in a new order this time.
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {dueItems.length} board{dueItems.length === 1 ? "" : "s"} due
        </Typography>
      </Paper>

      <Game
        deck={board}
        boardSize={board.length}
        selected={selected}
        onClick={handleClick}
        onClear={() => setSelected([])}
        gameMode="normal"
        lastSet={[]}
        answer={revealed ? currentItem.cards : null}
      />

      <div className={classes.actions}>
        <Button
          variant="outlined"
          color="primary"
          disabled={revealed}
          onClick={handleGiveUp}
        >
          Give Up
        </Button>
        <Button
          variant="contained"
          color="primary"
          disabled={!revealed}
          onClick={handleNext}
        >
          Next Board
        </Button>
      </div>
    </>
  );
}

export default HardBoardsTraining;
