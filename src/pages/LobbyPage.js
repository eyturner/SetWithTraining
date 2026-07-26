import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import FormControlLabel from "@mui/material/FormControlLabel";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Switch from "@mui/material/Switch";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import makeStyles from "@mui/styles/makeStyles";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import InternalLink from "../components/InternalLink";
import { UserContext } from "../context";
import { modes } from "../util";
import { getDueItems } from "../utils/srsQueue";

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(3),
    marginTop: theme.spacing(4),
  },
  modeGroup: {
    marginTop: theme.spacing(2),
  },
  startButton: {
    marginTop: theme.spacing(3),
  },
  trainingButton: {
    marginTop: theme.spacing(1.5),
  },
  links: {
    padding: "16px 0",
  },
}));

function LobbyPage() {
  const classes = useStyles();
  const navigate = useNavigate();
  const user = useContext(UserContext);
  const [mode, setMode] = useState("normal");
  const [enableHint, setEnableHint] = useState(false);

  const dueCount = getDueItems(user.id).length;

  function startGame() {
    const params = new URLSearchParams({ mode });
    if (enableHint) params.set("hint", "true");
    navigate(`/game?${params.toString()}`);
  }

  return (
    <Container maxWidth="sm">
      <Paper className={classes.paper}>
        <Typography variant="h5" gutterBottom>
          Set — Solo Practice
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Choose a game mode and start playing!
        </Typography>

        <RadioGroup
          className={classes.modeGroup}
          value={mode}
          onChange={(e) => setMode(e.target.value)}
        >
          {Object.entries(modes).map(([key, { name, description }]) => (
            <Tooltip key={key} arrow placement="right" title={description}>
              <FormControlLabel
                value={key}
                control={<Radio size="small" />}
                label={name}
              />
            </Tooltip>
          ))}
        </RadioGroup>

        <Tooltip
          arrow
          title="Reveal cards from the answer one at a time to help you find a Set."
        >
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={enableHint}
                onChange={(e) => setEnableHint(e.target.checked)}
              />
            }
            label="Enable Hints"
            sx={{ mt: 1 }}
          />
        </Tooltip>

        <Button
          className={classes.startButton}
          variant="contained"
          color="primary"
          fullWidth
          onClick={startGame}
        >
          Start Game
        </Button>
      </Paper>

      <Paper className={classes.paper}>
        <Typography variant="h5" gutterBottom>
          Training Mode
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Sharpen specific skills with focused drills.
        </Typography>

        <Button
          className={classes.trainingButton}
          variant="outlined"
          color="primary"
          fullWidth
          onClick={() => navigate("/game?training=find-third")}
        >
          Find the Third
        </Button>
        <Button
          className={classes.trainingButton}
          variant="outlined"
          color="primary"
          fullWidth
          onClick={() => navigate("/game?training=find-all")}
        >
          Find All Sets
        </Button>
        <Button
          className={classes.trainingButton}
          variant="outlined"
          color="primary"
          fullWidth
          onClick={() => navigate("/game?training=hard-boards")}
        >
          Practice Hard Boards{dueCount > 0 ? ` (${dueCount} due)` : ""}
        </Button>
      </Paper>

      <Typography
        variant="body1"
        align="center"
        className={classes.links}
      >
        <InternalLink to="/help">Help</InternalLink> •{" "}
        <InternalLink to="/about">About</InternalLink> •{" "}
        <InternalLink to="/conduct">Conduct</InternalLink> •{" "}
        <Link
          target="_blank"
          rel="noopener"
          href="https://github.com/ekzhang/setwithfriends"
          underline="hover"
        >
          GitHub
        </Link>
      </Typography>
    </Container>
  );
}

export default LobbyPage;
