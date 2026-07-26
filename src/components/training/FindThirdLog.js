import Typography from "@mui/material/Typography";
import makeStyles from "@mui/styles/makeStyles";
import { memo, useEffect, useRef } from "react";

import { formatTime } from "../../util";
import autoscroll from "../../utils/autoscroll";
import Scrollbox from "../Scrollbox";
import SetCard from "../SetCard";
import Subheading from "../Subheading";

const useStyles = makeStyles((theme) => ({
  chatPanel: {
    display: "flex",
    flexDirection: "column",
  },
  chat: {
    overflowY: "auto",
    flexGrow: 1,
    overflowWrap: "anywhere",
    padding: "0 4px",
  },
  instructionsEntry: {
    marginBottom: "0.35em",
    padding: "6px 12px",
    textAlign: "center",
  },
  logEntry: {
    marginBottom: "0.35em",
    padding: "6px 12px",
    textAlign: "center",
    background: theme.custom.setFoundEntry,
  },
  cardsRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  },
}));

const LogEntry = memo(function LogEntry({ entry }) {
  const classes = useStyles();
  const cards = entry.hasThird ? [...entry.prompt, entry.conjugate] : entry.prompt;

  return (
    <div className={classes.logEntry}>
      <Typography variant="subtitle2" color={entry.correct ? "primary" : "error"}>
        {entry.correct ? `Correct — ${formatTime(entry.elapsed)}` : "Incorrect"}
      </Typography>
      <div className={classes.cardsRow}>
        {cards.map((card) => (
          <SetCard key={card} size="sm" value={card} />
        ))}
        {!entry.hasThird && (
          <Typography variant="body2" color="textSecondary">
            No Set
          </Typography>
        )}
      </div>
    </div>
  );
});

/** Shows a log of "Find the Third" rounds and how long each correct answer took. */
function FindThirdLog({ entries }) {
  const classes = useStyles();

  const logEl = useRef();
  useEffect(() => {
    return autoscroll(logEl.current);
  }, []);

  return (
    <section
      className={classes.chatPanel}
      style={{ flexGrow: 1, overflowY: "hidden" }}
    >
      <Subheading>Set Log</Subheading>
      <Scrollbox className={classes.chat} ref={logEl}>
        <div className={classes.instructionsEntry}>
          <Typography variant="body2" color="textSecondary">
            Two cards are highlighted on the board. If a third card completes
            a Set with them, click it. Otherwise, click "No Set" (or press
            Space).
          </Typography>
        </div>
        {entries.map((entry) => (
          <LogEntry key={entry.id} entry={entry} />
        ))}
      </Scrollbox>
    </section>
  );
}

export default memo(FindThirdLog);
