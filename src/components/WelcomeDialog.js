import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import makeStyles from "@mui/styles/makeStyles";

import useStorage from "../hooks/useStorage";
import InternalLink from "./InternalLink";

const useStyles = makeStyles({
  emoji: {
    display: "inline-block",
    width: "1.5em",
  },
});

function WelcomeDialog() {
  const classes = useStyles();
  const [visited, setVisited] = useStorage("welcome-v2", "new-user");
  const handleClose = () => setVisited("returning-user");
  return (
    <Dialog open={visited === "new-user"} onClose={handleClose}>
      <DialogTitle>Set with Friends</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1">
          Welcome to <em>Set with Friends</em>, a solo Set card game that runs
          entirely in your browser! Here's what you can do:
        </Typography>
        <Typography variant="body1" component="div" style={{ padding: 12 }}>
          <div>
            <span className={classes.emoji} role="img" aria-label="Game emoji">
              🎮
            </span>
            Play <strong>solo Set</strong> right in your browser.
          </div>
          <div>
            <span className={classes.emoji} role="img" aria-label="Fire emoji">
              🔥
            </span>
            Try four <strong>game modes</strong>: Normal, Junior, Set-Chain, and
            UltraSet.
          </div>
          <div>
            <span className={classes.emoji} role="img" aria-label="Books emoji">
              📚
            </span>
            Review the <strong>rules of Set</strong> at our{" "}
            <InternalLink to="/help" onClick={handleClose}>
              help page
            </InternalLink>
            .
          </div>
          <div>
            <span className={classes.emoji} role="img" aria-label="Bulb emoji">
              💡
            </span>
            Enable <strong>hints</strong> to practice finding Sets.
          </div>
        </Typography>
        <Typography variant="body1">
          Good luck, and have fun playing Set!
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Enter
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default WelcomeDialog;
