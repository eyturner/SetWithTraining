import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import makeStyles from "@mui/styles/makeStyles";
import { useNavigate } from "react-router-dom";

import FindAllSetsTraining from "../components/training/FindAllSetsTraining";
import FindThirdTraining from "../components/training/FindThirdTraining";
import HardBoardsTraining from "../components/training/HardBoardsTraining";

const TRAINING_TYPES = {
  "find-third": {
    title: "Find the Third",
    Component: FindThirdTraining,
    fullWidth: true,
  },
  "find-all": {
    title: "Find All Sets",
    Component: FindAllSetsTraining,
    fullWidth: true,
  },
  "hard-boards": {
    title: "Practice Hard Boards",
    Component: HardBoardsTraining,
  },
};

const useStyles = makeStyles((theme) => ({
  header: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
}));

function TrainingPage({ type }) {
  const classes = useStyles();
  const navigate = useNavigate();

  const training = TRAINING_TYPES[type];

  if (!training) {
    return (
      <Container sx={{ pb: 2 }} maxWidth="sm">
        <div className={classes.header}>
          <Typography variant="h5">Unknown training mode</Typography>
          <Button variant="text" onClick={() => navigate("/")}>
            Back to Lobby
          </Button>
        </div>
      </Container>
    );
  }

  const { title, Component, fullWidth } = training;

  return (
    <Container sx={{ pb: 2 }}>
      <div className={classes.header}>
        <Typography variant="h5">{title}</Typography>
        <Button variant="text" onClick={() => navigate("/")}>
          Back to Lobby
        </Button>
      </div>
      <Grid container justifyContent="center">
        <Grid item xs={12} sm={fullWidth ? 12 : 8} md={fullWidth ? 12 : 9}>
          <Component />
        </Grid>
      </Grid>
    </Container>
  );
}

export default TrainingPage;
