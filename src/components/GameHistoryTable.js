import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { grey } from "@mui/material/colors";
import { useTheme } from "@mui/material/styles";
import makeStyles from "@mui/styles/makeStyles";

import { colors, formatTime, modes } from "../util";
import ElapsedTime from "./ElapsedTime";
import Loading from "./Loading";

// Training modes aren't part of `modes` (which only covers core game modes),
// so they need their own display name/color here.
const EXTRA_MODES = {
  "find-all": { name: "Find All Sets", color: "blue" },
};

const useStyles = makeStyles((theme) => ({
  gamesTable: {
    display: "flex",
    flexDirection: "column",
    maxHeight: 400,
    marginBottom: theme.spacing(1),
    whiteSpace: "nowrap",
    "& td, & th": {
      paddingTop: 6,
      paddingBottom: 6,
      paddingLeft: 12,
      paddingRight: 12,
    },
    "& th": {
      background: theme.palette.background.panel,
    },
    "& tr": {
      background: theme.custom.profileTable.row,
    },
  },
  // Remove cells of some columns of table for small screens
  vanishingTableCell: {
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
}));

function GameHistoryTable({ games }) {
  const classes = useStyles();
  const theme = useTheme();

  if (games === null) {
    return <Loading />;
  }
  if (games.length === 0) {
    return (
      <Typography style={{ color: grey[400] }}>
        No recent games in this category.
      </Typography>
    );
  }
  return (
    <TableContainer component={Paper} className={classes.gamesTable}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Mode</TableCell>
            <TableCell>Num. Sets</TableCell>
            <TableCell>Length</TableCell>
            <TableCell>Avg. Time / Set</TableCell>
            <TableCell>Longest Set</TableCell>
            <TableCell className={classes.vanishingTableCell}>
              Played
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {games.map((game) => {
            const modeInfo =
              modes[game.mode] ?? EXTRA_MODES[game.mode] ?? modes.normal;
            return (
              <TableRow key={game.id}>
                <TableCell
                  style={{
                    color:
                      colors[modeInfo.color][
                        theme.palette.mode === "dark" ? 100 : 900
                      ],
                  }}
                >
                  {modeInfo.name}
                </TableCell>
                <TableCell>{game.numSets}</TableCell>
                <TableCell>{formatTime(game.duration)}</TableCell>
                <TableCell>{formatTime(game.avgSetTime, true)}</TableCell>
                <TableCell>{formatTime(game.longestSetTime, true)}</TableCell>
                <TableCell className={classes.vanishingTableCell}>
                  <ElapsedTime value={game.playedAt} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default GameHistoryTable;
