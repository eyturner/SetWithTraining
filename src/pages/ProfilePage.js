import EqualizerIcon from "@mui/icons-material/Equalizer";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Typography from "@mui/material/Typography";
import makeStyles from "@mui/styles/makeStyles";
import { useContext, useState } from "react";

import GameHistoryTable from "../components/GameHistoryTable";
import Loading from "../components/Loading";
import ProfileName from "../components/ProfileName";
import Subheading from "../components/Subheading";
import UserStatistics from "../components/UserStatistics";
import { UserContext } from "../context";
import useGameHistory from "../hooks/useGameHistory";
import useStats from "../hooks/useStats";
import { modes } from "../util";

const datasetVariants = {
  all: {
    label: "All Games",
    filterFn: () => true,
  },
  solo: {
    label: "Solo Games",
    filterFn: (game) => Object.keys(game.users).length === 1,
  },
  multiplayer: {
    label: "Multiplayer Games",
    filterFn: (game) => Object.keys(game.users).length > 1,
  },
};

const useStyles = makeStyles((theme) => ({
  statsHeading: {
    // Pixel-perfect corrections for icon alignment
    paddingTop: 4,
    [theme.breakpoints.down("sm")]: {
      paddingTop: 3,
    },
  },
  divider: {
    [theme.breakpoints.down("md")]: {
      display: "none",
    },
  },
  mainGrid: {
    marginBottom: theme.spacing(1),
  },
}));

function ProfilePage() {
  const { id: userId } = useContext(UserContext);
  const classes = useStyles();

  const [stats, loadingStats] = useStats(userId);
  const [variant, setVariant] = useState("all");
  const [modeVariant, setModeVariant] = useState("normal");
  const games = useGameHistory(userId);

  return (
    <Container sx={{ pb: 2 }}>
      <Paper style={{ padding: 16 }}>
        <Grid container className={classes.mainGrid}>
          <Grid item xs={12} md={4}>
            <ProfileName userId={userId} />
          </Grid>
          <Divider
            orientation="vertical"
            variant="middle"
            flexItem
            className={classes.divider}
          />
          <Grid item xs={12} style={{ flex: 1 }} p={1}>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <div style={{ display: "flex" }}>
                <Subheading className={classes.statsHeading}>
                  Statistics
                </Subheading>
                <EqualizerIcon sx={{ mt: "1px" }} />
              </div>
              <div style={{ marginLeft: "auto" }}>
                <Select
                  variant="standard"
                  value={modeVariant}
                  onChange={(event) => setModeVariant(event.target.value)}
                  style={{ marginRight: "1em" }}
                  color="secondary"
                >
                  {Object.entries(modes).map(([key, { name }]) => (
                    <MenuItem key={key} value={key}>
                      <Typography variant="body2">{name}</Typography>
                    </MenuItem>
                  ))}
                </Select>
                <Select
                  variant="standard"
                  value={variant}
                  onChange={(event) => setVariant(event.target.value)}
                  color="secondary"
                >
                  {Object.entries(datasetVariants).map(([key, { label }]) => (
                    <MenuItem key={key} value={key}>
                      <Typography variant="body2">{label}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </div>
            </div>
            {loadingStats ? (
              <Loading />
            ) : (
              <UserStatistics stats={stats[modeVariant]} variant={variant} />
            )}
          </Grid>
        </Grid>
        <Subheading style={{ textAlign: "left" }}>Finished Games</Subheading>
        <GameHistoryTable games={games} />
      </Paper>
    </Container>
  );
}

export default ProfilePage;
