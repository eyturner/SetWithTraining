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
  setEntry: {
    marginBottom: "0.35em",
    padding: "6px 12px",
    textAlign: "center",
    background: theme.custom.setFoundEntry,
  },
  boardEntry: {
    marginBottom: "0.35em",
    padding: "6px 12px",
    textAlign: "center",
    background: "rgba(255, 193, 7, 0.15)",
  },
  gameEntry: {
    marginBottom: "0.35em",
    padding: "6px 12px",
    textAlign: "center",
    background: "rgba(76, 175, 80, 0.2)",
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

  if (entry.type === "board") {
    return (
      <div className={classes.boardEntry}>
        <Typography variant="subtitle2">
          Board {entry.boardIndex} cleared — {formatTime(entry.elapsed)}
        </Typography>
      </div>
    );
  }

  if (entry.type === "game") {
    return (
      <div className={classes.gameEntry}>
        <Typography variant="subtitle2">
          All boards cleared! Total time: {formatTime(entry.elapsed)}
        </Typography>
      </div>
    );
  }

  return (
    <div className={classes.setEntry}>
      <Typography variant="subtitle2" color="primary">
        Set found — {formatTime(entry.elapsed)}
      </Typography>
      <div className={classes.cardsRow}>
        {entry.cards.map((card) => (
          <SetCard key={card} size="sm" value={card} />
        ))}
      </div>
    </div>
  );
});

/** Shows a log of Sets found, boards cleared, and how long each took. */
function FindAllSetsLog({ entries }) {
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
            Clear 5 boards by finding every Set on each one. Cards stay in
            place, since one card can belong to multiple Sets.
          </Typography>
        </div>
        {entries.map((entry) => (
          <LogEntry key={entry.id} entry={entry} />
        ))}
      </Scrollbox>
    </section>
  );
}

export default memo(FindAllSetsLog);
